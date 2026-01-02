/**
 * RacerValidator
 * Input validation and anti-cheat measures for multiplayer racing
 */

import { 
  RacerInput, 
  Vector3, 
  ValidationResult,
  Checkpoint 
} from '../types/racer.types';
import { 
  RACER_PHYSICS, 
  TRACK_BOUNDS, 
  VALIDATION_THRESHOLDS,
  CHECKPOINT_CONFIG,
  ERROR_MESSAGES 
} from '../utils/racerConstants';

export class RacerValidator 
{
  private lastCheckpointTime: Map<string, number> = new Map();
  private lastInputTime: Map<string, number> = new Map();

  /**
   * Sanitize and validate player input
   */
  public sanitizeInput(input: RacerInput): RacerInput 
  {
    return {
      throttle: this.clamp(input.throttle, VALIDATION_THRESHOLDS.INPUT_THROTTLE_MIN, VALIDATION_THRESHOLDS.INPUT_THROTTLE_MAX),
      brake: this.clamp(input.brake, VALIDATION_THRESHOLDS.INPUT_BRAKE_MIN, VALIDATION_THRESHOLDS.INPUT_BRAKE_MAX),
      steering: this.clamp(input.steering, VALIDATION_THRESHOLDS.INPUT_STEERING_MIN, VALIDATION_THRESHOLDS.INPUT_STEERING_MAX),
      timestamp: input.timestamp
    };
  }

  /**
   * Validate position delta to prevent teleporting
   */
  public validatePositionDelta(
    playerId: string,
    oldPos: Vector3, 
    newPos: Vector3, 
    deltaTime: number
  ): ValidationResult 
  {
    const distance = this.calculateDistance(oldPos, newPos);
    const maxDistancePerTick = RACER_PHYSICS.MAX_VELOCITY * deltaTime;
    const allowedDistance = maxDistancePerTick * RACER_PHYSICS.POSITION_TOLERANCE;
    
    if (distance > allowedDistance) 
    {
      console.warn(`[Validator] 🚨 Player ${playerId} teleport detected: ${distance.toFixed(2)} > ${allowedDistance.toFixed(2)}`);
      
      return {
        valid: false,
        reason: ERROR_MESSAGES.TELEPORT_DETECTED,
        correctedValue: oldPos
      };
    }

    return { valid: true };
  }

  /**
   * Validate and clamp velocity
   */
  public validateVelocity(velocity: Vector3): ValidationResult 
  {
    const speed = this.calculateMagnitude(velocity);
    
    if (speed > RACER_PHYSICS.MAX_VELOCITY) 
    {
      const normalized = this.normalize(velocity);
      const correctedVelocity: Vector3 = {
        x: normalized.x * RACER_PHYSICS.MAX_VELOCITY,
        y: normalized.y * RACER_PHYSICS.MAX_VELOCITY,
        z: normalized.z * RACER_PHYSICS.MAX_VELOCITY
      };
      
      console.warn(`[Validator] ⚠️  Velocity clamped: ${speed.toFixed(2)} → ${RACER_PHYSICS.MAX_VELOCITY}`);
      
      return {
        valid: false,
        reason: ERROR_MESSAGES.SPEED_HACK_DETECTED,
        correctedValue: correctedVelocity
      };
    }

    return { valid: true, correctedValue: velocity };
  }

  /**
   * Check if player is out of bounds
   */
  public isOutOfBounds(position: Vector3): boolean 
  {
    return (
      position.x < TRACK_BOUNDS.MIN_X ||
      position.x > TRACK_BOUNDS.MAX_X ||
      position.y < TRACK_BOUNDS.MIN_Y ||
      position.y > TRACK_BOUNDS.MAX_Y ||
      position.z < TRACK_BOUNDS.MIN_Z ||
      position.z > TRACK_BOUNDS.MAX_Z
    );
  }

  /**
   * Validate checkpoint order
   */
  public validateCheckpointOrder(
    playerId: string,
    currentCheckpoint: number,
    nextCheckpoint: number,
    totalCheckpoints: number
  ): ValidationResult 
  {
    const expectedNext = (currentCheckpoint + 1) % totalCheckpoints;
    
    if (nextCheckpoint !== expectedNext) 
    {
      console.warn(`[Validator] ❌ Player ${playerId} checkpoint out of order: expected ${expectedNext}, got ${nextCheckpoint}`);
      
      return {
        valid: false,
        reason: ERROR_MESSAGES.CHECKPOINT_INVALID
      };
    }

    return { valid: true };
  }

  /**
   * Validate distance to checkpoint
   */
  public validateCheckpointDistance(
    playerPos: Vector3,
    checkpointPos: Vector3,
    checkpoint: Checkpoint
  ): boolean 
  {
    const distance = this.calculateDistance(playerPos, checkpointPos);
    return distance <= checkpoint.radius;
  }

  /**
   * Check if player can pass checkpoint (cooldown)
   */
  public canPassCheckpoint(playerId: string): boolean 
  {
    const now = Date.now();
    const lastTime = this.lastCheckpointTime.get(playerId) || 0;
    
    if (now - lastTime < CHECKPOINT_CONFIG.COOLDOWN) 
    {
      return false;
    }
    
    this.lastCheckpointTime.set(playerId, now);
    return true;
  }

  /**
   * Validate player input rate (anti-spam)
   */
  public validateInputRate(playerId: string): boolean 
  {
    const now = Date.now();
    const lastTime = this.lastInputTime.get(playerId) || 0;
    const minInterval = 1000 / 120; // Max 120 inputs per second
    
    if (now - lastTime < minInterval) 
    {
      return false;
    }
    
    this.lastInputTime.set(playerId, now);
    return true;
  }

  /**
   * Check for speed hacking
   */
  public detectSpeedHack(velocity: Vector3): boolean 
  {
    const speed = this.calculateMagnitude(velocity);
    const maxAllowedSpeed = RACER_PHYSICS.MAX_VELOCITY * VALIDATION_THRESHOLDS.SPEED_HACK_MULTIPLIER;
    
    return speed > maxAllowedSpeed;
  }

  /**
   * Validate lap completion
   */
  public validateLapCompletion(
    checkpointsPassed: number,
    _totalCheckpoints: number
  ): boolean 
  {
    return checkpointsPassed >= CHECKPOINT_CONFIG.MIN_CHECKPOINTS_FOR_LAP;
  }

  /**
   * Helper: Calculate distance between two positions
   */
  private calculateDistance(pos1: Vector3, pos2: Vector3): number 
  {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Helper: Calculate magnitude of vector
   */
  private calculateMagnitude(vec: Vector3): number 
  {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  }

  /**
   * Helper: Normalize vector
   */
  private normalize(vec: Vector3): Vector3 
  {
    const magnitude = this.calculateMagnitude(vec);
    
    if (magnitude === 0) 
    {
      return { x: 0, y: 0, z: 0 };
    }
    
    return {
      x: vec.x / magnitude,
      y: vec.y / magnitude,
      z: vec.z / magnitude
    };
  }

  /**
   * Helper: Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number 
  {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Clean up player data
   */
  public cleanupPlayer(playerId: string): void 
  {
    this.lastCheckpointTime.delete(playerId);
    this.lastInputTime.delete(playerId);
  }

  /**
   * Reset all validator state
   */
  public reset(): void 
  {
    this.lastCheckpointTime.clear();
    this.lastInputTime.clear();
  }
}