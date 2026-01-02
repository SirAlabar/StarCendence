/**
 * RacerGameManager
 * Manages multiple concurrent racing game instances
 * Handles game lifecycle, player join/leave, and cleanup
 */

import { RacerEngine } from '../engines/RacerEngine';
import { 
  Checkpoint,
  PlayerStateDTO,
  RaceStatus 
} from '../types/racer.types';
import { RACE_CONFIG } from '../utils/racerConstants';

interface GameInstance 
{
  gameId: string;
  engine: RacerEngine;
  createdAt: number;
  lastUpdateAt: number;
  updateInterval: NodeJS.Timeout | null;
}

export class RacerGameManager 
{
  private games: Map<string, GameInstance> = new Map();
  private readonly tickRate: number;
  private readonly tickInterval: number;

  constructor() 
  {
    this.tickRate = RACE_CONFIG.TICK_RATE;
    this.tickInterval = 1000 / this.tickRate; // milliseconds per tick
    
    console.log(`[RacerGameManager] 🏁 Initialized (${this.tickRate} ticks/sec)`);
  }

  /**
   * Create a new race instance
   */
  public createGame(
    gameId: string,
    checkpoints: Checkpoint[],
    players: Array<{ playerId: string; username: string }>,
    totalLaps: number = RACE_CONFIG.DEFAULT_LAPS
  ): boolean 
  {
    if (this.games.has(gameId)) 
    {
      console.warn(`[RacerGameManager] ⚠️  Game ${gameId} already exists`);
      return false;
    }

    // Validate inputs
    if (!checkpoints || checkpoints.length === 0) 
    {
      console.error(`[RacerGameManager] ❌ Cannot create game ${gameId}: no checkpoints provided`);
      return false;
    }

    if (!players || players.length === 0) 
    {
      console.error(`[RacerGameManager] ❌ Cannot create game ${gameId}: no players`);
      return false;
    }

    if (players.length > RACE_CONFIG.MAX_PLAYERS) 
    {
      console.error(`[RacerGameManager] ❌ Cannot create game ${gameId}: too many players (${players.length} > ${RACE_CONFIG.MAX_PLAYERS})`);
      return false;
    }

    // Create engine
    const engine = new RacerEngine(gameId, checkpoints, totalLaps);

    // Add all players
    let addedCount = 0;
    for (const player of players) 
    {
      if (engine.addPlayer(player.playerId, player.username)) 
      {
        addedCount++;
      }
    }

    if (addedCount === 0) 
    {
      console.error(`[RacerGameManager] ❌ Failed to add any players to game ${gameId}`);
      engine.dispose();
      return false;
    }

    // Create game instance
    const gameInstance: GameInstance = {
      gameId,
      engine,
      createdAt: Date.now(),
      lastUpdateAt: Date.now(),
      updateInterval: null
    };

    this.games.set(gameId, gameInstance);

    console.log(`[RacerGameManager] ✅ Game ${gameId} created with ${addedCount}/${players.length} players, ${checkpoints.length} checkpoints, ${totalLaps} laps`);

    return true;
  }

  /**
   * Start race countdown
   */
  public startRace(gameId: string): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Cannot start race: game ${gameId} not found`);
      return false;
    }

    // Start countdown
    game.engine.startCountdown();

    // Start game loop
    this.startGameLoop(game);

    console.log(`[RacerGameManager] 🏁 Race ${gameId} countdown started`);
    return true;
  }

  /**
   * Start game update loop
   */
  private startGameLoop(game: GameInstance): void 
  {
    if (game.updateInterval) 
    {
      console.warn(`[RacerGameManager] ⚠️  Game loop already running for ${game.gameId}`);
      return;
    }

    let lastTickTime = Date.now();

    game.updateInterval = setInterval(() => 
    {
      const now = Date.now();
      const deltaTime = (now - lastTickTime) / 1000; // Convert to seconds
      lastTickTime = now;

      // Update game engine
      const events = game.engine.update(deltaTime);

      // Update last update time
      game.lastUpdateAt = now;

      // Process events (these will be published to Redis in the handler)
      if (events.length > 0) 
      {
        // Events are handled by the game loop callback
        // (will be set up in the WebSocket handler)
      }

      // Check if race is finished
      if (game.engine.isFinished()) 
      {
        this.stopGameLoop(game);
        
        // Schedule cleanup after 30 seconds
        setTimeout(() => 
        {
          this.destroyGame(game.gameId);
        }, 30000);
      }
    }, this.tickInterval);

    console.log(`[RacerGameManager] ⏱️  Game loop started for ${game.gameId} (${this.tickRate} Hz)`);
  }

  /**
   * Stop game update loop
   */
  private stopGameLoop(game: GameInstance): void 
  {
    if (game.updateInterval) 
    {
      clearInterval(game.updateInterval);
      game.updateInterval = null;
      console.log(`[RacerGameManager] ⏸️  Game loop stopped for ${game.gameId}`);
    }
  }

  /**
   * Get game engine
   */
  public getGame(gameId: string): RacerEngine | null 
  {
    const game = this.games.get(gameId);
    return game ? game.engine : null;
  }

  /**
   * Check if game exists
   */
  public hasGame(gameId: string): boolean 
  {
    return this.games.has(gameId);
  }

  /**
   * Add player to existing game (late join)
   */
  public addPlayerToGame(
    gameId: string, 
    playerId: string, 
    username: string
  ): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Cannot add player: game ${gameId} not found`);
      return false;
    }

    const success = game.engine.addPlayer(playerId, username);
    
    if (success) 
    {
      console.log(`[RacerGameManager] ➕ Player ${username} added to game ${gameId}`);
    }
    
    return success;
  }

  /**
   * Remove player from game
   */
  public removePlayerFromGame(gameId: string, playerId: string): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Cannot remove player: game ${gameId} not found`);
      return false;
    }

    game.engine.removePlayer(playerId);
    console.log(`[RacerGameManager] ➖ Player ${playerId} removed from game ${gameId}`);

    // Check if game is empty
    const state = game.engine.getState();
    if (state.players.size === 0) 
    {
      console.log(`[RacerGameManager] 🗑️  Game ${gameId} is empty, scheduling cleanup...`);
      
      // Destroy game after 10 seconds if still empty
      setTimeout(() => 
      {
        const currentGame = this.games.get(gameId);
        if (currentGame && currentGame.engine.getState().players.size === 0) 
        {
          this.destroyGame(gameId);
        }
      }, 10000);
    }

    return true;
  }

  /**
   * Get current game state for broadcasting
   */
  public getGameStateDTO(gameId: string): PlayerStateDTO[] | null 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      return null;
    }

    return game.engine.getStateDTO();
  }

  /**
   * Handle player input
   */
  public handlePlayerInput(
    gameId: string, 
    playerId: string, 
    input: any
  ): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Input from unknown game: ${gameId}`);
      return false;
    }

    game.engine.handleInput(playerId, input);
    return true;
  }

  /**
   * Handle checkpoint passed event from client
   */
  public onCheckpointPassed(
    gameId: string, 
    playerId: string, 
    checkpointIndex: number
  ): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Checkpoint from unknown game: ${gameId}`);
      return false;
    }

    game.engine.onCheckpointPassed(playerId, checkpointIndex);
    return true;
  }

  /**
   * Update player position (from client)
   */
  public updatePlayerPosition(
    gameId: string,
    playerId: string,
    position: any,
    rotation: any,
    velocity: any
  ): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      return false;
    }

    return game.engine.updatePlayerPosition(playerId, position, rotation, velocity);
  }

  /**
   * Get all active games
   */
  public getActiveGames(): string[] 
  {
    return Array.from(this.games.keys());
  }

  /**
   * Get game count
   */
  public getGameCount(): number 
  {
    return this.games.size;
  }

  /**
   * Get game info
   */
  public getGameInfo(gameId: string): any 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      return null;
    }

    const state = game.engine.getState();
    
    return {
      gameId: game.gameId,
      status: state.raceStatus,
      players: state.players.size,
      maxPlayers: state.maxPlayers,
      totalLaps: state.totalLaps,
      checkpoints: state.totalCheckpoints,
      createdAt: game.createdAt,
      lastUpdateAt: game.lastUpdateAt,
      isRunning: game.updateInterval !== null
    };
  }

  /**
   * Destroy game instance
   */
  public destroyGame(gameId: string): boolean 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      console.warn(`[RacerGameManager] ⚠️  Cannot destroy: game ${gameId} not found`);
      return false;
    }

    // Stop game loop
    this.stopGameLoop(game);

    // Dispose engine
    game.engine.dispose();

    // Remove from map
    this.games.delete(gameId);

    console.log(`[RacerGameManager] 🗑️  Game ${gameId} destroyed`);
    return true;
  }

  /**
   * Cleanup stale games (no updates in 10 minutes)
   */
  public cleanupStaleGames(): number 
  {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    let cleanedCount = 0;

    this.games.forEach((game, gameId) => 
    {
      const timeSinceUpdate = now - game.lastUpdateAt;
      
      if (timeSinceUpdate > staleThreshold) 
      {
        console.warn(`[RacerGameManager] 🧹 Cleaning up stale game ${gameId} (${Math.round(timeSinceUpdate / 60000)} minutes old)`);
        this.destroyGame(gameId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) 
    {
      console.log(`[RacerGameManager] 🧹 Cleaned up ${cleanedCount} stale games`);
    }

    return cleanedCount;
  }

  /**
   * Dispose all games
   */
  public dispose(): void 
  {
    console.log(`[RacerGameManager] 🗑️  Disposing all games...`);
    
    this.games.forEach((game) => 
    {
      this.stopGameLoop(game);
      game.engine.dispose();
    });

    this.games.clear();
    
    console.log(`[RacerGameManager] ✅ All games disposed`);
  }

  /**
   * Get statistics
   */
  public getStats(): any 
  {
    const stats = {
      totalGames: this.games.size,
      activeGames: 0,
      finishedGames: 0,
      totalPlayers: 0,
      gamesInCountdown: 0,
      gamesRacing: 0
    };

    this.games.forEach((game) => 
    {
      const state = game.engine.getState();
      
      stats.totalPlayers += state.players.size;
      
      if (state.raceStatus === RaceStatus.RACING) 
      {
        stats.activeGames++;
        stats.gamesRacing++;
      } 
      else if (state.raceStatus === RaceStatus.COUNTDOWN) 
      {
        stats.activeGames++;
        stats.gamesInCountdown++;
      } 
      else if (state.raceStatus === RaceStatus.FINISHED) 
      {
        stats.finishedGames++;
      }
    });

    return stats;
  }
}