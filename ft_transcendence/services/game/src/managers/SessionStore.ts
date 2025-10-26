// Session Store - In-memory storage for active game sessions
import { GameSession } from '../types/game.types';

/**
 * In-memory store for active game sessions
 */
class SessionStore
{
  private sessions: Map<string, GameSession>;

  constructor()
  {
    this.sessions = new Map();
  }

  /**
   * Store a game session
   */
  store(gameId: string, session: GameSession): void
  {
    this.sessions.set(gameId, session);
  }

  /**
   * Get a game session
   */
  get(gameId: string): GameSession | undefined
  {
    return this.sessions.get(gameId);
  }

  /**
   * Check if session exists
   */
  has(gameId: string): boolean
  {
    return this.sessions.has(gameId);
  }

  /**
   * Delete a game session
   */
  delete(gameId: string): boolean
  {
    return this.sessions.delete(gameId);
  }

  /**
   * Get all active sessions
   */
  getAll(): GameSession[]
  {
    return Array.from(this.sessions.values());
  }

  /**
   * Get all session IDs
   */
  getAllIds(): string[]
  {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session count
   */
  count(): number
  {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clear(): void
  {
    this.sessions.clear();
  }

  /**
   * Get sessions by status
   */
  getByStatus(status: string): GameSession[]
  {
    return Array.from(this.sessions.values()).filter(
      session => session.game.status === status
    );
  }

  /**
   * Cleanup old sessions (not running for > 30 minutes)
   */
  cleanup(): number
  {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    for (const [gameId, session] of this.sessions.entries())
    {
      if (!session.isRunning && (now - session.lastTickTime) > timeout)
      {
        this.sessions.delete(gameId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
export const sessionStore = new SessionStore();