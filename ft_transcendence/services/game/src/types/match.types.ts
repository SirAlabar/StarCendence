// Match Types - Match results and history

import { GameType, GameMode } from '../utils/constants';

/**
 * Match result (saved to database after game ends)
 */
export interface Match
{
  id: string;
  gameId: string;
  type: GameType;
  mode: GameMode;
  
  // Result
  winnerId?: string;
  duration: number; // Seconds
  
  // Final state
  results: MatchResult[];
  
  // Statistics
  totalPoints?: number; // Pong: total points scored
  fastestLap?: number; // Racer: fastest lap time
  
  playedAt: Date;
}

/**
 * Individual player result in a match
 */
export interface MatchResult
{
  matchId: string;
  userId: string;
  username: string;
  
  // Final score/position
  score: number; // Pong: points scored, Racer: final position (1-4)
  
  // Additional stats
  accuracy?: number; // Pong: paddle hit accuracy
  topSpeed?: number; // Racer: maximum speed reached
  bestLapTime?: number; // Racer: best lap time
}

/**
 * Match history query result
 */
export interface MatchHistory
{
  matches: Match[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Player match history
 */
export interface PlayerMatchHistory
{
  userId: string;
  matches: Match[];
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}
