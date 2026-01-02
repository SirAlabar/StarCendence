/**
 * Racer Game Types
 * TypeScript type definitions for multiplayer racing game
 */

export interface Vector3 
{
  x: number;
  y: number;
  z: number;
}

export interface Quaternion 
{
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Player input from client
 */
export interface RacerInput 
{
  throttle: number;    // 0.0 to 1.0
  brake: number;       // 0.0 to 1.0
  steering: number;    // -1.0 to 1.0 (left/right)
  timestamp: number;   // Client timestamp
}

/**
 * Player state in the race
 */
export interface PlayerState 
{
  playerId: string;
  username: string;
  
  // Transform
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  
  // Race progress
  currentLap: number;
  checkpointIndex: number;
  lastCheckpointTime: number;
  
  // Status
  isFinished: boolean;
  isRespawning: boolean;
  finishTime: number | null;
  
  // Performance
  lapTimes: number[];
  bestLapTime: number | null;
}

/**
 * Complete race state
 */
export interface RacerGameState 
{
  gameId: string;
  players: Map<string, PlayerState>;
  
  // Race configuration
  totalLaps: number;
  totalCheckpoints: number;
  maxPlayers: number;
  
  // Race status
  raceStatus: RaceStatus;
  startTime: number | null;
  endTime: number | null;
  
  // Track info
  trackName: string;
  trackBounds: TrackBounds;
}

/**
 * Racer state (alias for compatibility with game.types.ts)
 */
export type RacerState = RacerGameState;

/**
 * Track boundaries for validation
 */
export interface TrackBounds 
{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Checkpoint data
 */
export interface Checkpoint 
{
  id: number;
  name: string;
  position: Vector3;
  radius: number;
  isStartLine: boolean;
}

/**
 * Race status enum
 */
export enum RaceStatus 
{
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  RACING = 'racing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

/**
 * Player standings for leaderboard
 */
export interface PlayerStanding 
{
  position: number;
  playerId: string;
  username: string;
  currentLap: number;
  checkpointIndex: number;
  distanceToNextCheckpoint: number;
  isFinished: boolean;
  finishTime: number | null;
}

/**
 * Validation result
 */
export interface ValidationResult 
{
  valid: boolean;
  reason?: string;
  correctedValue?: any;
}

/**
 * Race event types
 */
export enum RaceEventType 
{
  CHECKPOINT_PASSED = 'checkpoint_passed',
  LAP_COMPLETED = 'lap_completed',
  RACE_FINISHED = 'race_finished',
  PLAYER_RESPAWNED = 'player_respawned',
  PLAYER_OUT_OF_BOUNDS = 'player_out_of_bounds',
  RACE_STARTED = 'race_started',
  COUNTDOWN_TICK = 'countdown_tick'
}

/**
 * Race event payload
 */
export interface RaceEvent 
{
  type: RaceEventType;
  gameId: string;
  playerId: string;
  timestamp: number;
  data: any;
}

/**
 * Racer event data (alias for compatibility with event.types.ts)
 */
export type RacerEventData = RaceEvent['data'];

/**
 * Input message from client
 */
export interface RacerInputMessage 
{
  type: 'game:racer:input';
  gameId: string;
  playerId: string;
  input: RacerInput;
}

/**
 * State update message to clients
 */
export interface RacerStateMessage 
{
  type: 'game:racer:state';
  gameId: string;
  timestamp: number;
  players: PlayerStateDTO[];
}

/**
 * Player state DTO (Data Transfer Object) for network
 */
export interface PlayerStateDTO 
{
  playerId: string;
  username: string;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  currentLap: number;
  checkpointIndex: number;
  isFinished: boolean;
}

/**
 * Event message to clients
 */
export interface RacerEventMessage 
{
  type: string;
  gameId: string;
  playerId?: string;
  timestamp: number;
  data: any;
}

/**
 * Race configuration
 */
export interface RaceConfig 
{
  totalLaps: number;
  maxPlayers: number;
  trackName: string;
  countdownDuration: number;  // seconds
  respawnCooldown: number;     // milliseconds
  checkpointTimeout: number;   // milliseconds
}

/**
 * Request to create a new race (from lobby)
 */
export interface CreateRaceRequest 
{
  gameId: string;
  players: Array<{
    playerId: string;
    username: string;
  }>;
  checkpoints: Checkpoint[];
  totalLaps: number;
}

/**
 * Player spawn data
 */
export interface SpawnPoint 
{
  position: Vector3;
  rotation: Quaternion;
}