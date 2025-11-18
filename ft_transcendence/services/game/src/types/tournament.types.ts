
import { GameType, TournamentStatus } from '../utils/constants';

/**
 * Tournament
 */
export interface Tournament
{
  id: string;
  name: string;
  type: GameType;
  status: TournamentStatus;
  
  // Configuration
  maxParticipants: number;
  currentParticipants: number;
  currentRound: number;
  totalRounds: number;
  
  // Participants
  participants: TournamentPlayer[];
  
  // Brackets
  bracket: TournamentBracket;
  
  // Winner
  winnerId?: string;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

/**
 * Player in tournament
 */
export interface TournamentPlayer
{
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  
  // Seeding
  seed: number;
  
  // Progress
  currentRound: number;
  isEliminated: boolean;
  
  joinedAt: Date;
}


/**
 * Tournament bracket structure
 */
export interface TournamentBracket
{
  rounds: TournamentRound[];
}

/**
 * Tournament round
 */
export interface TournamentRound
{
  roundNumber: number;
  matches: TournamentMatch[];
}

/**
 * Tournament match
 */
export interface TournamentMatch
{
  id: string;
  tournamentId: string;
  roundNumber: number;
  
  player1Id?: string;
  player2Id?: string;
  
  winnerId?: string;
  gameId?: string; // Reference to actual game
  
  status: 'pending' | 'ready' | 'playing' | 'finished';
}


/**
 * Tournament configuration
 */
export interface TournamentConfig
{
  name: string;
  type: GameType;
  maxParticipants: number;
  gameSettings: {
    maxScore?: number; // For Pong
    lapCount?: number; // For Racer
  };
}
