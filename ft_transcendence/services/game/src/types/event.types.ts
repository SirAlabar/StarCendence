// Event Types - Game events, Redis messages, and real-time communication

import { GameState } from './game.types';
import { PongEventData } from './pong.types';

/**
 * Game event (scored, finished, player joined, etc.)
 */
export interface GameEvent
{
  gameId: string;
  type: GameEventType;
  timestamp: number;
  data: GameEventData;
}

/**
 * Game event types
 */
export enum GameEventType
{
  // Game lifecycle
  GAME_CREATED = 'GAME_CREATED',
  GAME_STARTED = 'GAME_STARTED',
  GAME_FINISHED = 'GAME_FINISHED',
  GAME_CANCELLED = 'GAME_CANCELLED',
  
  // Player events
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_READY = 'PLAYER_READY',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  
  // Pong events
  PONG_SCORED = 'PONG_SCORED',
  PONG_BALL_HIT = 'PONG_BALL_HIT',
  PONG_WALL_HIT = 'PONG_WALL_HIT',
  
  // Racer events
  RACER_LAP_COMPLETE = 'RACER_LAP_COMPLETE',
  RACER_CHECKPOINT_HIT = 'RACER_CHECKPOINT_HIT',
  RACER_POWERUP_COLLECTED = 'RACER_POWERUP_COLLECTED',
  RACER_FINISHED = 'RACER_FINISHED',
}

/**
 * Game event data (union of all possible event data)
 */
export type GameEventData = 
  | PlayerEventData
  | PongEventData
  | GenericEventData;

/**
 * Player-related event data
 */
export interface PlayerEventData
{
  playerId: string;
  username: string;
  avatar?: any;
  action?: 'joined' | 'left' | 'ready' | 'disconnected' | 'reconnected';
}

/**
 * Generic event data
 */
export interface GenericEventData
{
  message?: string;
  [key: string]: any;
}

/**
 * Player input from client
 */
export interface PlayerInput
{
  playerId: string;
  gameId: string;
  timestamp: number;
  type: InputType;
  data: any; // PongInput or RacerInput
}

/**
 * Input type enum
 */
export enum InputType
{
  PONG_MOVE = 'PONG_MOVE',
  RACER_ACCELERATE = 'RACER_ACCELERATE',
  RACER_BRAKE = 'RACER_BRAKE',
  RACER_TURN = 'RACER_TURN',
  RACER_POWERUP = 'RACER_POWERUP',
}

/**
 * Base Redis message structure
 */
export interface RedisMessage
{
  channel: string;
  type: string;
  gameId: string;
  timestamp: number;
  data: any;
}

/**
 * Game state update message (Redis)
 * Published by Game Service, consumed by WebSocket Service
 */
export interface GameStateUpdate extends RedisMessage
{
  type: 'state_update';
  data: GameState;
}

/**
 * Game event message (Redis)
 * Published by Game Service, consumed by WebSocket Service
 */
export interface GameEventMessage extends RedisMessage
{
  type: 'event';
  data: GameEvent;
}

/**
 * Player input message (Redis)
 * Published by WebSocket Service, consumed by Game Service
 */
export interface PlayerInputMessage extends RedisMessage
{
  type: 'input';
  data: PlayerInput;
}

/**
 * Player action message (Redis)
 * For join, leave, ready, etc.
 */
export interface PlayerActionMessage extends RedisMessage
{
  type: 'player_action';
  data: {
    playerId: string;
    action: 'join' | 'leave' | 'ready' | 'disconnect';
    metadata?: any;
  };
}

/**
 * Redis channel helper functions
 */
export class RedisChannels
{
  /**
   * Get input channel for a game
   */
  static gameInput(gameId: string): string
  {
    return `game:${gameId}:input`;
  }
  
  /**
   * Get updates channel for a game
   */
  static gameUpdates(gameId: string): string
  {
    return `game:${gameId}:updates`;
  }
  
  /**
   * Get events channel for a game
   */
  static gameEvents(gameId: string): string
  {
    return `game:${gameId}:events`;
  }
  
  /**
   * Get tournament updates channel
   */
  static tournamentUpdates(tournamentId: string): string
  {
    return `tournament:${tournamentId}:updates`;
  }
}
