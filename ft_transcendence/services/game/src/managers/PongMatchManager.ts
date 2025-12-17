import { RedisClientType } from 'redis';

/**
 * Pong Match Manager
 * Manages online Pong matches with shared ball authority
 * 
 * Authority Model:
 * - Each player controls their own paddle (client-authoritative)
 * - Ball authority belongs to the player who WILL be hit next
 * - When ball crosses center or hits paddle, authority transfers
 */

interface PongMatch {
  matchId: string;
  player1: {
    userId: string;
    username: string;
    paddleY: number;
    score: number;
    ready: boolean;
  };
  player2: {
    userId: string;
    username: string;
    paddleY: number;
    score: number;
    ready: boolean;
  };
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
  ballAuthority: string; // DEPRECATED - server is now authoritative
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  startTime?: number;
  endTime?: number;
  winner?: string;
  gameLoopInterval?: NodeJS.Timeout;
}

export class PongMatchManager {
  private redis: RedisClientType;
  public matches: Map<string, PongMatch> = new Map();

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Initialize a match from a lobby
   */
  async initializeMatch(
    lobbyId: string,
    player1UserId: string,
    player1Username: string,
    player2UserId: string,
    player2Username: string
  ): Promise<PongMatch> {
    const match: PongMatch = {
      matchId: lobbyId,
      player1: {
        userId: player1UserId,
        username: player1Username,
        paddleY: 0.5, // normalized position (0-1)
        score: 0,
        ready: false,
      },
      player2: {
        userId: player2UserId,
        username: player2Username,
        paddleY: 0.5,
        score: 0,
        ready: false,
      },
      ball: {
        x: 0.5,
        y: 0.5,
        dx: 0,
        dy: 0,
      },
      ballAuthority: player1UserId, // Deprecated but kept for compatibility
      status: 'starting',
      startTime: Date.now(),
    };

    this.matches.set(lobbyId, match);

    // Store in Redis for persistence
    await this.redis.hSet(`match:${lobbyId}`, {
      data: JSON.stringify(match),
    });

    console.log(`[PongMatch] 🎮 Match initialized: ${lobbyId}`, {
      player1: player1Username,
      player2: player2Username,
      initialAuthority: match.ballAuthority === player1UserId ? player1Username : player2Username,
    });

    return match;
  }

  /**
   * Get match by ID
   */
  getMatch(matchId: string): PongMatch | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Mark player as ready
   */
  async markPlayerReady(matchId: string, userId: string): Promise<boolean> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    if (match.player1.userId === userId) {
      match.player1.ready = true;
    } else if (match.player2.userId === userId) {
      match.player2.ready = true;
    } else {
      return false;
    }

    await this.saveMatch(matchId);
    
    // Return true if both players are ready
    return match.player1.ready && match.player2.ready;
  }

  /**
   * Check if both players are ready
   */
  areBothPlayersReady(matchId: string): boolean {
    const match = this.matches.get(matchId);
    if (!match) return false;
    return match.player1.ready && match.player2.ready;
  }

  /**
   * Start the match and begin server-side physics loop
   */
  async startMatch(matchId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    match.status = 'playing';
    
    // Initialize ball with random direction
    const direction = Math.random() > 0.5 ? 1 : -1;
    match.ball.dx = 0.012 * direction; // Normalized velocity per frame at 30Hz
    match.ball.dy = 0.006 * (Math.random() > 0.5 ? 1 : -1);
    
    // Start server-side game loop at 30Hz
    match.gameLoopInterval = setInterval(() => {
      this.updateMatchPhysics(matchId);
    }, 33); // 30Hz (~33ms per frame)
    
    await this.saveMatch(matchId);

    console.log(`[PongMatch] ▶️  Match started: ${matchId}`);
  }

  /**
   * Server-authoritative ball physics update
   */
  private updateMatchPhysics(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'playing') {
      return;
    }

    // Move ball
    match.ball.x += match.ball.dx;
    match.ball.y += match.ball.dy;

    // Top/bottom wall collision
    const ballRadius = 0.015; // Normalized radius
    if (match.ball.y <= ballRadius || match.ball.y >= 1 - ballRadius) {
      match.ball.dy *= -1;
      match.ball.y = Math.max(ballRadius, Math.min(1 - ballRadius, match.ball.y));
    }

    // Paddle dimensions (normalized to match client proportions)
    // Client: width=10px, height=100px on typical 800x600 canvas
    const paddleWidth = 0.0125;  // ~10px on 800px width
    const paddleHeight = 0.167;   // ~100px on 600px height

    // Left paddle collision (player 1)
    // Client left paddle x = 30px = 0.0375 on 800px
    const leftPaddleX = 0.0375;
    if (
      match.ball.x - ballRadius <= leftPaddleX + paddleWidth - 0.002 &&
      match.ball.x >= leftPaddleX + 0.002 &&
      match.ball.y >= match.player1.paddleY - paddleHeight / 2 &&
      match.ball.y <= match.player1.paddleY + paddleHeight / 2 &&
      match.ball.dx < 0
    ) {
      match.ball.dx = Math.abs(match.ball.dx) * 1.05; // Increase speed
      const hitPoint = (match.ball.y - match.player1.paddleY) / (paddleHeight / 2);
      match.ball.dy = hitPoint * 0.01;
      match.ball.x = leftPaddleX + paddleWidth + ballRadius;
    }

    // Right paddle collision (player 2)
    // Client right paddle x = canvas.width - 10 - 30 = 0.95 on normalized
    const rightPaddleX = 0.95 - paddleWidth;
    if (
      match.ball.x + ballRadius >= rightPaddleX + 0.002 &&
      match.ball.x <= rightPaddleX + paddleWidth - 0.002 &&
      match.ball.y >= match.player2.paddleY - paddleHeight / 2 &&
      match.ball.y <= match.player2.paddleY + paddleHeight / 2 &&
      match.ball.dx > 0
    ) {
      match.ball.dx = -Math.abs(match.ball.dx) * 1.05; // Increase speed
      const hitPoint = (match.ball.y - match.player2.paddleY) / (paddleHeight / 2);
      match.ball.dy = hitPoint * 0.01;
      match.ball.x = rightPaddleX - ballRadius;
    }

    // Goal detection - check if ball went out of bounds
    let goalScored: 1 | 2 | null = null;
    
    if (match.ball.x <= 0) {
      // Ball went past left side - player 2 scores
      goalScored = 2;
    } else if (match.ball.x >= 1) {
      // Ball went past right side - player 1 scores
      goalScored = 1;
    }

    // If goal was scored, handle it
    if (goalScored) {
      this.handleGoalScored(matchId, goalScored);
    }
  }

  /**
   * Handle goal scored during physics update
   */
  private async handleGoalScored(matchId: string, scorer: 1 | 2): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) return;

    // Stop game loop temporarily
    if (match.gameLoopInterval) {
      clearInterval(match.gameLoopInterval);
      match.gameLoopInterval = undefined;
    }

    // Record the goal
    if (scorer === 1) {
      match.player1.score++;
    } else {
      match.player2.score++;
    }

    const score: [number, number] = [match.player1.score, match.player2.score];

    console.log(`[PongMatch] ⚽ Goal scored in ${matchId} by player ${scorer}! Score: ${score[0]}-${score[1]}`);

    // Check for winner
    let winner: string | undefined;
    if (match.player1.score >= 5) {
      winner = match.player1.userId;
      await this.endMatch(matchId, winner);
    } else if (match.player2.score >= 5) {
      winner = match.player2.userId;
      await this.endMatch(matchId, winner);
    }

    // Publish goal event to Redis for GameEventSubscriber to broadcast
    await this.redis.publish('game:events', JSON.stringify({
      type: 'game:goal:scored',
      payload: {
        matchId,
        scorer,
        score,
        winner
      }
    }));

    // If no winner, restart ball after 2 seconds
    if (!winner) {
      setTimeout(async () => {
        await this.restartBall(matchId);
      }, 2000);
    }
  }

  /**
   * Update paddle position
   */
  async updatePaddle(matchId: string, userId: string, normalizedY: number): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'playing') {
      return;
    }

    // Clamp to 0-1 range
    const y = Math.max(0, Math.min(1, normalizedY));

    if (match.player1.userId === userId) {
      match.player1.paddleY = y;
    } else if (match.player2.userId === userId) {
      match.player2.paddleY = y;
    }
  }

  /**
   * Transfer ball authority to opponent
   */
  async transferBallAuthority(matchId: string, fromUserId: string): Promise<string> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Transfer to opponent
    const newAuthority =
      match.ballAuthority === match.player1.userId ? match.player2.userId : match.player1.userId;

    match.ballAuthority = newAuthority;
    await this.saveMatch(matchId);

    console.log(`[PongMatch] 🔄 Ball authority transferred in ${matchId}:`, {
      from: fromUserId,
      to: newAuthority,
    });

    return newAuthority;
  }

  /**
   * Record a goal
   */
  async recordGoal(matchId: string, scorer: 1 | 2): Promise<{ score: [number, number]; winner?: string }> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Update score
    if (scorer === 1) {
      match.player1.score++;
    } else {
      match.player2.score++;
    }

    const score: [number, number] = [match.player1.score, match.player2.score];

    console.log(`[PongMatch] ⚽ Goal scored in ${matchId}:`, {
      scorer: scorer === 1 ? match.player1.username : match.player2.username,
      newScore: score,
    });

    // Reset ball to center
    match.ball.x = 0.5;
    match.ball.y = 0.5;
    match.ball.dx = 0;
    match.ball.dy = 0;

    // Check for winner (first to 5)
    if (match.player1.score >= 5 || match.player2.score >= 5) {
      const winner = match.player1.score >= 5 ? match.player1.userId : match.player2.userId;
      await this.endMatch(matchId, winner);
      return { score, winner };
    }

    await this.saveMatch(matchId);
    return { score };
  }

  /**
   * End the match
   */
  async endMatch(matchId: string, winnerId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    // Stop game loop
    if (match.gameLoopInterval) {
      clearInterval(match.gameLoopInterval);
      match.gameLoopInterval = undefined;
    }

    match.status = 'ended';
    match.endTime = Date.now();
    match.winner = winnerId;

    await this.saveMatch(matchId);

    const winnerName =
      winnerId === match.player1.userId ? match.player1.username : match.player2.username;

    console.log(`[PongMatch] 🏆 Match ended: ${matchId}`, {
      winner: winnerName,
      finalScore: [match.player1.score, match.player2.score],
      duration: match.endTime - (match.startTime || 0),
    });

    // Clean up after 5 minutes
    setTimeout(() => {
      this.matches.delete(matchId);
      this.redis.del(`match:${matchId}`);
    }, 5 * 60 * 1000);
  }

  /**
   * Handle player disconnect
   */
  async handlePlayerDisconnect(matchId: string, userId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match || match.status === 'ended') {
      return;
    }

    // Award win to opponent
    const winnerId =
      userId === match.player1.userId ? match.player2.userId : match.player1.userId;

    console.log(`[PongMatch] 🚪 Player disconnected from ${matchId}: ${userId}`);
    await this.endMatch(matchId, winnerId);
  }

  /**
   * Get player number (1 or 2)
   */
  getPlayerNumber(matchId: string, userId: string): 1 | 2 | null {
    const match = this.matches.get(matchId);
    if (!match) {
      return null;
    }

    if (match.player1.userId === userId) return 1;
    if (match.player2.userId === userId) return 2;
    return null;
  }

  /**
   * Get opponent's paddle position
   */
  getOpponentPaddleY(matchId: string, userId: string): number | null {
    const match = this.matches.get(matchId);
    if (!match) {
      return null;
    }

    if (match.player1.userId === userId) {
      return match.player2.paddleY;
    } else if (match.player2.userId === userId) {
      return match.player1.paddleY;
    }

    return null;
  }

  /**
   * Check if user has ball authority (DEPRECATED - server is authoritative now)
   */
  hasBallAuthority(): boolean {
    // Always return true for backward compatibility during transition
    return true;
  }

  /**
   * Restart ball after goal with delay
   */
  async restartBall(matchId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'playing') {
      return;
    }

    // Ball restarts toward the player who was scored on
    const lastScorer = match.player1.score > match.player2.score ? 1 : 2;
    const direction = lastScorer === 1 ? 1 : -1; // Go toward opponent
    
    match.ball.dx = 0.006 * direction;
    match.ball.dy = 0.003 * (Math.random() > 0.5 ? 1 : -1);

    console.log(`[PongMatch] 🔄 Ball restarted in ${matchId}`);
  }

  /**
   * Get all active matches
   */
  getActiveMatches(): PongMatch[] {
    return Array.from(this.matches.values()).filter((m) => m.status === 'playing');
  }

  /**
   * Save match to Redis
   */
  private async saveMatch(matchId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    // Create a copy without the gameLoopInterval (circular reference)
    const { gameLoopInterval, ...matchData } = match;

    await this.redis.hSet(`match:${matchId}`, {
      data: JSON.stringify(matchData),
      updatedAt: Date.now().toString(),
    });
  }

  /**
   * Load match from Redis
   */
  async loadMatch(matchId: string): Promise<PongMatch | null> {
    try {
      const data = await this.redis.hGet(`match:${matchId}`, 'data');
      if (!data) {
        return null;
      }

      const match = JSON.parse(data) as PongMatch;
      this.matches.set(matchId, match);
      return match;
    } catch (error) {
      console.error(`[PongMatch] Failed to load match ${matchId}:`, error);
      return null;
    }
  }

  /**
   * Clean up expired matches
   */
  async cleanupExpiredMatches(): Promise<void> {
    const now = Date.now();
    const expiredMatches: string[] = [];

    this.matches.forEach((match, matchId) => {
      // Clean up matches that ended more than 5 minutes ago
      if (match.status === 'ended' && match.endTime && now - match.endTime > 5 * 60 * 1000) {
        expiredMatches.push(matchId);
      }

      // Clean up matches stuck in starting state for more than 2 minutes
      if (match.status === 'starting' && match.startTime && now - match.startTime > 2 * 60 * 1000) {
        expiredMatches.push(matchId);
      }
    });

    for (const matchId of expiredMatches) {
      this.matches.delete(matchId);
      await this.redis.del(`match:${matchId}`);
      console.log(`[PongMatch] 🧹 Cleaned up expired match: ${matchId}`);
    }
  }
}
