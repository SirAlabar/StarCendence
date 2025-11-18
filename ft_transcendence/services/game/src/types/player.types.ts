// Player Types - Player entities and statistics

import { PlayerRole } from '../utils/constants';

/**
 * Player participating in a game
 */
export interface GamePlayer
{
  id: string;
  userId: string;
  username: string;
  role: PlayerRole; // PLAYER1, PLAYER2, PLAYER3, PLAYER4, SPECTATOR
  
  // Connection state
  isConnected: boolean;
  isReady: boolean;
  
  // Game state
  score: number;
  position?: number; // For racing games (1st, 2nd, 3rd, 4th)
  
  // Statistics (for current game)
  stats: PlayerGameStats;
  
  // Timestamps
  joinedAt: Date;
  leftAt?: Date;
}

/**
 * Player statistics for current game session
 */
export interface PlayerGameStats
{
  // Pong stats
  paddleHits?: number;
  ballsScored?: number;
  accuracy?: number; // Percentage
  
  // Racer stats
  bestLapTime?: number;
  checkpointsHit?: number;
  currentSpeed?: number;
  maxSpeedReached?: number;
}

/**
 * Player overall statistics (from database)
 */
export interface PlayerStats
{
  userId: string;
  
  // Overall
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  
  // Pong
  pongStats: PongStats;
  
  // Racer
  racerStats: RacerStats;
  
  // Points ratings
  pongPoints: number;
  racerPoints: number;
  
  // Streaks
  currentWinStreak: number;
  longestWinStreak: number;
  
  updatedAt: Date;
}

/**
 * Pong-specific statistics
 */
export interface PongStats
{
  gamesPlayed: number;
  gamesWon: number;
  pointsScored: number;
  bestScore: number;
  averageScore: number;
  accuracy: number;
}

/**
 * Racer-specific statistics
 */
export interface RacerStats
{
  gamesPlayed: number;
  gamesWon: number;
  bestLapTime?: number;
  bestPosition: number;
  averagePosition: number;
  totalDistance: number;
}
