// Core Game Types - Game entities and session management

import { GameType, GameMode, GameStatus } from '../utils/constants';
import { PongState } from './pong.types';
import { RacerState } from './racer.types';
import { GamePlayer } from './player.types';

/**
 * Main game entity (persisted in database)
 * Represents a multiplayer game session
 */
export interface Game
{
  id: string;
  type: GameType; // PONG or RACER
  mode: GameMode; // multiplayer_2p, multiplayer_3p, multiplayer_4p, tournament
  status: GameStatus;
  
  // Player configuration
  maxPlayers: number; // 2, 3, or 4
  minPlayers: number; // 2
  currentPlayers: number;
  
  // Game-specific settings
  maxScore?: number; // For Pong
  lapCount?: number; // For Racer
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  
  // Tournament relation
  tournamentId?: string;
}

/**
 * Active game session (in-memory representation)
 * Used by game engine during gameplay
 */
export interface GameSession
{
  id: string;
  game: Game;
  state: GameState;
  players: Map<string, GamePlayer>; // playerId → GamePlayer
  
  // Game loop
  isRunning: boolean;
  tickCount: number;
  lastTickTime: number;
  
  // Room/channel info
  redisChannel: string; // e.g., "game:123:updates"
}

/**
 * Current game state (updated 60 FPS)
 * Sent to all players via Redis
 */
export interface GameState
{
  type: GameType;
  timestamp: number;
  
  // Pong-specific state
  pong?: PongState;
  
  // Racer-specific state
  racer?: RacerState;
  
  // Common state
  scores: number[]; // Index matches player number
  timeElapsed: number; // Seconds since game started
}

/**
 * Check if game type is Pong
 */
export function isPongGame(type: GameType): boolean
{
  return type === GameType.PONG;
}

/**
 * Check if game type is Racer
 */
export function isRacerGame(type: GameType): boolean
{
  return type === GameType.RACER;
}

/**
 * Check if game is multiplayer (2+ players)
 */
export function isMultiplayerGame(mode: GameMode): boolean
{
  return [
    GameMode.MULTIPLAYER_2P,
    GameMode.MULTIPLAYER_3P,
    GameMode.MULTIPLAYER_4P,
    GameMode.TOURNAMENT,
  ].includes(mode);
}

/**
 * Check if game status is active (playing)
 */
export function isGameActive(status: GameStatus): boolean
{
  return [GameStatus.STARTING, GameStatus.PLAYING].includes(status);
}

/**
 * Check if game status is finished
 */
export function isGameFinished(status: GameStatus): boolean
{
  return [GameStatus.FINISHED, GameStatus.CANCELLED].includes(status);
}
