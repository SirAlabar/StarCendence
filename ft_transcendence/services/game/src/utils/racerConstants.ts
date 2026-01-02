/**
 * Racer Game Constants
 * Physics limits, validation thresholds, and game configuration
 */

/**
 * Physics constants
 */
export const RACER_PHYSICS = {
  MAX_VELOCITY: 200,              // Maximum speed (units/second)
  MAX_ACCELERATION: 50,           // Maximum acceleration
  MAX_STEERING_ANGLE: 45,         // Maximum steering angle in degrees
  DRAG_COEFFICIENT: 0.1,          // Air resistance
  FRICTION: 0.05,                 // Ground friction
  
  // Position validation
  MAX_POSITION_DELTA: 20,         // Max position change per tick (prevents teleporting)
  POSITION_TOLERANCE: 1.2,        // 20% tolerance for network jitter
} as const;

/**
 * Track boundaries (Polar Pass track)
 */
export const TRACK_BOUNDS = {
  MIN_X: -500,
  MAX_X: 500,
  MIN_Y: -50,      // Below this = out of bounds (respawn)
  MAX_Y: 100,      // Above this = out of bounds
  MIN_Z: -500,
  MAX_Z: 500,
} as const;

/**
 * Checkpoint configuration
 */
export const CHECKPOINT_CONFIG = {
  TRIGGER_RADIUS: 30,             // Distance to trigger checkpoint
  MIN_CHECKPOINTS_FOR_LAP: 10,    // Minimum checkpoints before lap counts
  COOLDOWN: 1000,                 // Milliseconds between checkpoint triggers
  VALIDATION_DISTANCE: 50,        // Max distance for valid checkpoint
} as const;

/**
 * Race configuration
 */
export const RACE_CONFIG = {
  DEFAULT_LAPS: 3,
  MIN_LAPS: 1,
  MAX_LAPS: 10,
  
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 1,
  
  COUNTDOWN_DURATION: 3,          // Seconds before race starts
  RESPAWN_COOLDOWN: 2000,         // Milliseconds before respawn
  
  // Update rates
  TICK_RATE: 30,                  // Server updates per second
  STATE_BROADCAST_RATE: 30,       // State broadcasts per second
  
  // Timeouts
  PLAYER_TIMEOUT: 30000,          // 30 seconds of no input = disconnect
  RACE_MAX_DURATION: 600000,      // 10 minutes max race time
} as const;

/**
 * Starting grid positions (4 players)
 */
export const SPAWN_POSITIONS = [
  {
    position: { x: 50, y: 10, z: -20 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
  },
  {
    position: { x: 50, y: 10, z: -6.67 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
  },
  {
    position: { x: 50, y: 10, z: 6.67 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
  },
  {
    position: { x: 50, y: 10, z: 20 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
  }
] as const;

/**
 * NOTE: Checkpoints are NOT hardcoded!
 * They are extracted from the polar_pass.glb mesh in RacerScene.ts
 * The frontend sends checkpoint data to backend when starting a race
 */

/**
 * Validation thresholds
 */
export const VALIDATION_THRESHOLDS = {
  // Position validation
  MAX_POSITION_CHANGE_PER_TICK: 20,
  MAX_HEIGHT_CHANGE_PER_TICK: 10,
  
  // Velocity validation
  MAX_VELOCITY_MAGNITUDE: 200,
  MIN_VELOCITY_MAGNITUDE: 0,
  
  // Input validation
  INPUT_THROTTLE_MIN: 0,
  INPUT_THROTTLE_MAX: 1,
  INPUT_BRAKE_MIN: 0,
  INPUT_BRAKE_MAX: 1,
  INPUT_STEERING_MIN: -1,
  INPUT_STEERING_MAX: 1,
  
  // Anti-cheat
  TELEPORT_THRESHOLD: 50,         // Distance = teleport
  SPEED_HACK_MULTIPLIER: 1.5,     // 50% over max speed = hack
  CHECKPOINT_SKIP_TOLERANCE: 2,   // Can skip max 2 checkpoints
} as const;

/**
 * Redis channel names
 */
export const REDIS_CHANNELS = {
  racerInput: (gameId: string) => `game:racer:input:${gameId}`,
  racerUpdates: (gameId: string) => `game:racer:updates:${gameId}`,
  racerEvents: (gameId: string) => `game:racer:events:${gameId}`,
  racerCommands: (gameId: string) => `game:racer:commands:${gameId}`,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  GAME_NOT_FOUND: 'Race not found',
  PLAYER_NOT_FOUND: 'Player not found in race',
  GAME_FULL: 'Race is full',
  GAME_STARTED: 'Race already started',
  GAME_FINISHED: 'Race already finished',
  INVALID_INPUT: 'Invalid player input',
  OUT_OF_BOUNDS: 'Player out of bounds',
  CHECKPOINT_INVALID: 'Invalid checkpoint progression',
  TELEPORT_DETECTED: 'Teleportation detected',
  SPEED_HACK_DETECTED: 'Speed hack detected',
} as const;