import { GAME_CONFIG } from '../utils/constants';

const { PONG } = GAME_CONFIG;

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface Paddle {
  y: number;
}

export interface PongState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  scores: {
    player1: number;
    player2: number;
  };
}

export interface PongEvent {
  type: 'goal' | 'paddle-hit' | 'wall-hit' | 'game-end';
  data?: any;
}

export interface PaddleInput {
  direction: 'up' | 'down' | 'none';
}

export class PongEngine {
  private state: PongState;
  private player1Id: string;
  private player2Id: string;
  private maxScore: number;
  private events: PongEvent[] = [];
  private resetCooldown: number = 0;
  

  constructor(player1Id: string, player2Id: string, maxScore: number = 1) {
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.maxScore = maxScore;
    
    // Initialize game state
    this.state = {
      ball: this.resetBall(),
      paddle1: { y: PONG.CANVAS.HEIGHT / 2 - PONG.PADDLE.HEIGHT / 2 },
      paddle2: { y: PONG.CANVAS.HEIGHT / 2 - PONG.PADDLE.HEIGHT / 2 },  
      scores: { player1: 0, player2: 0 },
    };
  }

  private resetBall(): Ball {
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to 45 degrees
    const direction = Math.random() > 0.5 ? 1 : -1; // Left or right
    
    return {
      x: PONG.CANVAS.WIDTH / 2,
      y: PONG.CANVAS.HEIGHT / 2,
      dx: Math.cos(angle) * PONG.BALL.INITIAL_SPEED * direction,
      dy: Math.sin(angle) * PONG.BALL.INITIAL_SPEED,
    };
  }

  update(): PongEvent[] {
    this.events = [];

    if (this.resetCooldown > 0) {
      this.resetCooldown--;
      return this.events; // Return empty events, game is "paused"
    }


    // Update ball position (constants already calibrated for 60 FPS)
    this.state.ball.x += this.state.ball.dx;
    this.state.ball.y += this.state.ball.dy;

    // Wall collisions (top and bottom)
    if (this.state.ball.y - PONG.BALL.RADIUS <= 0 || 
        this.state.ball.y + PONG.BALL.RADIUS >= PONG.CANVAS.HEIGHT) {
      this.state.ball.dy *= -1;
      this.state.ball.y = Math.max(PONG.BALL.RADIUS, 
                                     Math.min(PONG.CANVAS.HEIGHT - PONG.BALL.RADIUS, this.state.ball.y));
      this.events.push({ type: 'wall-hit' });
    }

    // Paddle 1 collision (left)
    if (this.state.ball.x - PONG.BALL.RADIUS <= PONG.PADDLE.OFFSET + PONG.PADDLE.WIDTH) {
      if (this.state.ball.y >= this.state.paddle1.y && 
          this.state.ball.y <= this.state.paddle1.y + PONG.PADDLE.HEIGHT) {
        // Hit paddle
        this.state.ball.dx = Math.abs(this.state.ball.dx);
        
        // Add spin based on where ball hit paddle
        const hitPos = (this.state.ball.y - this.state.paddle1.y) / PONG.PADDLE.HEIGHT;
        this.state.ball.dy = (hitPos - 0.5) * PONG.BALL.INITIAL_SPEED * 2;
        
        // Increase speed
        const speed = Math.sqrt(this.state.ball.dx ** 2 + this.state.ball.dy ** 2);
        if (speed < PONG.BALL.MAX_SPEED) {
          const newSpeed = Math.min(speed + PONG.BALL.SPEED_INCREMENT, PONG.BALL.MAX_SPEED);
          const ratio = newSpeed / speed;
          this.state.ball.dx *= ratio;
          this.state.ball.dy *= ratio;
        }
        
        this.events.push({ type: 'paddle-hit', data: { player: 1 } });
      }
    }

    // Paddle 2 collision (right)
    if (this.state.ball.x + PONG.BALL.RADIUS >= PONG.CANVAS.WIDTH - PONG.PADDLE.OFFSET - PONG.PADDLE.WIDTH) {
      if (this.state.ball.y >= this.state.paddle2.y && 
          this.state.ball.y <= this.state.paddle2.y + PONG.PADDLE.HEIGHT) {
        // Hit paddle
        this.state.ball.dx = -Math.abs(this.state.ball.dx);
        
        // Add spin based on where ball hit paddle
        const hitPos = (this.state.ball.y - this.state.paddle2.y) / PONG.PADDLE.HEIGHT;
        this.state.ball.dy = (hitPos - 0.5) * PONG.BALL.INITIAL_SPEED * 2;
        
        // Increase speed
        const speed = Math.sqrt(this.state.ball.dx ** 2 + this.state.ball.dy ** 2);
        if (speed < PONG.BALL.MAX_SPEED) {
          const newSpeed = Math.min(speed + PONG.BALL.SPEED_INCREMENT, PONG.BALL.MAX_SPEED);
          const ratio = newSpeed / speed;
          this.state.ball.dx *= ratio;
          this.state.ball.dy *= ratio;
        }
        
        this.events.push({ type: 'paddle-hit', data: { player: 2 } });
      }
    }

    // Goal detection
    if (this.state.ball.x - PONG.BALL.RADIUS <= 0) {
      // Player 2 scores
      this.state.scores.player2++;
      this.events.push({ type: 'goal', data: { scorer: 2, score: this.state.scores.player2 } });
      this.state.ball = this.resetBall();
      
      
      if (this.state.scores.player2 >= this.maxScore) {
        this.events.push({ type: 'game-end', data: { winner: this.player2Id } });
      }
    } else if (this.state.ball.x + PONG.BALL.RADIUS >= PONG.CANVAS.WIDTH) {
      // Player 1 scores
      this.state.scores.player1++;
      this.events.push({ type: 'goal', data: { scorer: 1, score: this.state.scores.player1 } });
      this.state.ball = this.resetBall();
      this.resetCooldown = 30;
      
      if (this.state.scores.player1 >= this.maxScore) {
        this.events.push({ type: 'game-end', data: { winner: this.player1Id } });
      }
    }

    return this.events;
  }

  handleInput(playerId: string, input: PaddleInput): void 
  {
    const isPlayer1 = playerId === this.player1Id;
    const paddle = isPlayer1 ? this.state.paddle1 : this.state.paddle2;
    
    if (input.direction === 'up') {
      paddle.y = Math.max(0, paddle.y - PONG.PADDLE.SPEED);
    } else if (input.direction === 'down') {
      paddle.y = Math.min(PONG.CANVAS.HEIGHT - PONG.PADDLE.HEIGHT, paddle.y + PONG.PADDLE.SPEED);
    }
  }

  getState(): PongState {
    return this.state;
  }

  isFinished(): boolean {
    return this.state.scores.player1 >= this.maxScore || 
           this.state.scores.player2 >= this.maxScore;
  }

  getWinner(): string | null {
    if (this.state.scores.player1 >= this.maxScore) {
      return this.player1Id;
    }
    if (this.state.scores.player2 >= this.maxScore) {
      return this.player2Id;
    }
    return null;
  }
}