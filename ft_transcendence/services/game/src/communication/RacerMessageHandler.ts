/**
 * RacerMessageHandler (SIMPLIFIED - CLIENT-AUTHORITATIVE)
 * 
 * Backend ONLY relays messages between players
 * NO physics computation - all physics runs on client
 */

import { 
  CreateRaceRequest 
} from '../types/racer.types';
import { 
  publishRacerState 
} from './RedisPublisher';

interface PlayerState 
{
  playerId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  velocity: { x: number; y: number; z: number };
  lastUpdate: number;
}

interface GameState 
{
  gameId: string;
  players: Map<string, PlayerState>;
  createdAt: number;
}

export class RacerMessageHandler 
{
  private games: Map<string, GameState> = new Map();
  private stateBroadcastIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() 
  {
    // Cleanup stale games every 5 minutes
    setInterval(() => 
    {
      this.cleanupStaleGames();
    }, 5 * 60 * 1000);
    
    console.log('[RacerMessageHandler] 🎮 Initialized (CLIENT-AUTHORITATIVE MODE)');
  }

  /**
   * Handle race creation from lobby
   */
  public async handleCreateRace(data: CreateRaceRequest): Promise<boolean> 
  {
    const { gameId, players } = data;

    console.log(`[RacerMessageHandler] 🏁 Creating relay for game ${gameId} with ${players.length} players`);

    // Create game state storage
    const gameState: GameState = {
      gameId,
      players: new Map(),
      createdAt: Date.now()
    };

    // Initialize player states
    for (const player of players) 
    {
      gameState.players.set(player.playerId, {
        playerId: player.playerId,
        position: { x: 50, y: 10, z: 0 }, // Default starting position
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        lastUpdate: Date.now()
      });
    }

    this.games.set(gameId, gameState);

    // Start broadcasting player states at 20 Hz
    this.startStateBroadcast(gameId);

    console.log(`[RacerMessageHandler] ✅ Race relay ${gameId} created`);
    return true;
  }

  /**
   * Handle player position update from client
   */
  public handlePositionUpdate(
    gameId: string,
    playerId: string,
    position: any,
    rotation: any,
    velocity: any
  ): void 
  {
    const game = this.games.get(gameId);
    
    if (!game) 
    {
      return;
    }

    // Update player state
    const playerState = game.players.get(playerId);
    
    if (playerState) 
    {
      playerState.position = position;
      playerState.rotation = rotation;
      playerState.velocity = velocity;
      playerState.lastUpdate = Date.now();
    }
  }

  /**
   * Handle player disconnect
   */
  public handlePlayerDisconnect(gameId: string, playerId: string): void 
  {
    console.log(`[RacerMessageHandler] 🚪 Player ${playerId} disconnected from race ${gameId}`);

    const game = this.games.get(gameId);
    
    if (game) 
    {
      game.players.delete(playerId);
      
      // If no players left, cleanup game
      if (game.players.size === 0) 
      {
        this.stopStateBroadcast(gameId);
        this.games.delete(gameId);
        console.log(`[RacerMessageHandler] 🗑️  Empty game ${gameId} cleaned up`);
      }
    }
  }

  /**
   * Start broadcasting game state to all players
   */
  private startStateBroadcast(gameId: string): void 
  {
    if (this.stateBroadcastIntervals.has(gameId)) 
    {
      return;
    }

    // Broadcast at 20 Hz (50ms intervals)
    const interval = setInterval(() => 
    {
      const game = this.games.get(gameId);

      if (game) 
      {
        // Build players array
        const players = Array.from(game.players.values()).map(player => ({
          playerId: player.playerId,
          position: player.position,
          rotation: player.rotation,
          velocity: player.velocity
        }));

        const playerIds = Array.from(game.players.keys());
        
        // Broadcast state to all players
        publishRacerState(gameId, players, playerIds);
      } 
      else 
      {
        this.stopStateBroadcast(gameId);
      }
    }, 50); // 20 Hz

    this.stateBroadcastIntervals.set(gameId, interval);
    console.log(`[RacerMessageHandler] 📡 State broadcast started for ${gameId} (20 Hz)`);
  }

  /**
   * Stop broadcasting game state
   */
  private stopStateBroadcast(gameId: string): void 
  {
    const interval = this.stateBroadcastIntervals.get(gameId);

    if (interval) 
    {
      clearInterval(interval);
      this.stateBroadcastIntervals.delete(gameId);
      console.log(`[RacerMessageHandler] 📡 State broadcast stopped for ${gameId}`);
    }
  }

  /**
   * Cleanup stale games (no updates in 10 minutes)
   */
  private cleanupStaleGames(): void 
  {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    let cleanedCount = 0;

    this.games.forEach((game, gameId) => 
    {
      // Check if any player has recent updates
      let hasRecentActivity = false;
      
      game.players.forEach((player) => 
      {
        if (now - player.lastUpdate < staleThreshold) 
        {
          hasRecentActivity = true;
        }
      });

      if (!hasRecentActivity) 
      {
        console.warn(`[RacerMessageHandler] 🧹 Cleaning up stale game ${gameId}`);
        this.stopStateBroadcast(gameId);
        this.games.delete(gameId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) 
    {
      console.log(`[RacerMessageHandler] 🧹 Cleaned up ${cleanedCount} stale games`);
    }
  }

  /**
   * Get active games
   */
  public getActiveGames(): string[] 
  {
    return Array.from(this.games.keys());
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
    
    return {
      gameId: game.gameId,
      players: game.players.size,
      createdAt: game.createdAt
    };
  }

  /**
   * Get statistics
   */
  public getStats(): any 
  {
    return {
      totalGames: this.games.size,
      totalPlayers: Array.from(this.games.values()).reduce((sum, game) => sum + game.players.size, 0)
    };
  }

  /**
   * Dispose handler
   */
  public dispose(): void 
  {
    console.log('[RacerMessageHandler] 🗑️  Disposing...');

    for (const interval of this.stateBroadcastIntervals.values())
    {
      clearInterval(interval);
    }
    this.stateBroadcastIntervals.clear();
    this.games.clear();

    console.log('[RacerMessageHandler] ✅ Disposed');
  }
}

// Singleton instance
export const racerMessageHandler = new RacerMessageHandler();