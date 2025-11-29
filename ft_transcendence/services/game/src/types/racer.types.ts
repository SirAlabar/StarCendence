// Racer Game Types - All Pod Racing-specific entities and logic

/**
 * Complete Racer game state
 */
export interface RacerState
{
  pods: Pod[];
  checkpoints: Checkpoint[];
  currentLap: number[];
  positions: number[]; // Race positions (1st, 2nd, 3rd, 4th)
}

/**
 * Pod racer vehicle
 */
export interface Pod
{
  playerId: string;
  
  // Position
  x: number;
  y: number;
  z: number;
  
  // Rotation
  rotation: number; // Radians
  
  // Physics
  velocity: Vector3;
  acceleration: number;
  speed: number;
  maxSpeed: number;
  
  // Race state
  currentLap: number;
  lastCheckpoint: number;
  position: number; // 1st, 2nd, 3rd, 4th
  
  // Boost/powerups
  hasPowerup?: boolean;
  powerupType?: string;
}

/**
 * Race checkpoint
 */
export interface Checkpoint
{
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
}

/**
 * 3D Vector for position/velocity
 */
export interface Vector3
{
  x: number;
  y: number;
  z: number;
}

/**
 * Racer player input
 */
export interface RacerInput
{
  accelerate?: boolean;
  brake?: boolean;
  turnDirection?: 'left' | 'right' | 'none';
  usePowerup?: boolean;
}

/**
 * Racer-specific event data
 */
export interface RacerEventData
{
  // Lap complete
  lapComplete?: {
    playerId: string;
    lapNumber: number;
    lapTime: number;
  };
  
  // Checkpoint hit
  checkpointHit?: {
    playerId: string;
    checkpointId: number;
    timestamp: number;
  };
  
  // Powerup collected
  powerupCollected?: {
    playerId: string;
    powerupType: string;
    position: Vector3;
  };
  
  // Race finished
  raceFinished?: {
    playerId: string;
    finalPosition: number;
    totalTime: number;
  };
}
