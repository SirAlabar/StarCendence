import { Vector3, Ray } from '@babylonjs/core';
import { RacerPod } from '../engines/racer/RacerPods';
import { RacerPhysics } from '../engines/racer/RacerPhysics';
import { AIWaypointSystem } from './AIWaypointSystem';
import { AIDifficulty, AIDifficultyLevel, AIDifficultyConfig } from './AIDifficulty';

export class AIRacerController 
{
  private pod: RacerPod;
  private physics: RacerPhysics;
  private waypoints: AIWaypointSystem;
  private config: AIDifficultyConfig;
  
  private currentWaypointIndex: number = 0;
  private targetWaypoint: Vector3 = Vector3.Zero();
  
  private stuckTimer: number = 0;
  private lastPosition: Vector3 = Vector3.Zero();
  
  private enabled: boolean = false;  // NEW: AI starts disabled
  
  constructor(
    pod: RacerPod,
    physics: RacerPhysics,
    waypoints: AIWaypointSystem,
    difficulty: AIDifficultyLevel = AIDifficultyLevel.MEDIUM
  ) 
  {
    this.pod = pod;
    this.physics = physics;
    this.waypoints = waypoints;
    this.config = AIDifficulty.getConfig(difficulty);
    
    const startPos = pod.getPosition();
    
    // Start at waypoint 1 (first checkpoint), skip waypoint 0 (start_line)
    // because bot spawns past the start line
    this.currentWaypointIndex = 1;
    
    const firstWaypoint = waypoints.getNextWaypoint(startPos, 1);
    this.targetWaypoint = firstWaypoint.position;
    this.lastPosition = startPos.clone();
    
    console.log(`[AI ${pod.getConfig().name}] Initialized targeting waypoint 1 (${firstWaypoint.position.x.toFixed(0)}, ${firstWaypoint.position.z.toFixed(0)})`);
  }
  
  public update(deltaTime: number): void 
  {
    // NEW: Don't update if disabled (during countdown)
    if (!this.enabled) 
    {
      return;
    }
    
    const podPos = this.pod.getPosition();
    
    const waypointUpdate = this.waypoints.getNextWaypoint(podPos, this.currentWaypointIndex);
    
    const distanceToWaypoint = Vector3.Distance(podPos, waypointUpdate.position);
    
    if (waypointUpdate.index !== this.currentWaypointIndex) 
    {
      console.log(`[AI ${this.pod.getConfig().name}] Reached waypoint ${this.currentWaypointIndex}, moving to ${waypointUpdate.index}`);
      this.currentWaypointIndex = waypointUpdate.index;
    }
    
    this.targetWaypoint = waypointUpdate.position;
    
    const steering = this.calculateSteering(podPos);
    const throttle = this.calculateThrottle(podPos);
    
    // Debug log every 60 frames (~1 second at 60fps)
    if (Math.random() < 0.016) 
    {
      console.log(`[AI ${this.pod.getConfig().name}] Waypoint: ${this.currentWaypointIndex}/${this.waypoints.getWaypointCount()}`);
      console.log(`  Position: (${podPos.x.toFixed(1)}, ${podPos.y.toFixed(1)}, ${podPos.z.toFixed(1)})`);
      console.log(`  Target: (${this.targetWaypoint.x.toFixed(1)}, ${this.targetWaypoint.y.toFixed(1)}, ${this.targetWaypoint.z.toFixed(1)})`);
      console.log(`  Distance to waypoint: ${distanceToWaypoint.toFixed(1)}`);
      console.log(`  Steering: ${steering.toFixed(2)}, Throttle: ${throttle.toFixed(2)}`);
    }
    
    this.physics.movePod(this.pod.getConfig().id, 
    {
      x: steering,
      z: throttle
    });
    
    this.checkStuck(podPos, deltaTime);
  }
  
  private calculateSteering(currentPos: Vector3): number 
  {
    const mesh = this.pod.getMesh();
    
    if (!mesh) 
    {
      return 0;
    }
    
    // Check for obstacles ahead
    const obstacle = this.detectObstacleAhead();
    
    if (obstacle.hasObstacle) 
    {
      // Emergency avoidance - steer away from obstacle
      return obstacle.direction * 0.9;
    }
    
    const toTarget = this.targetWaypoint.subtract(currentPos);
    toTarget.y = 0;
    toTarget.normalize();
    
    const forward = mesh.getDirection(new Vector3(-1, 0, 0));
    forward.y = 0;
    forward.normalize();
    
    const cross = Vector3.Cross(forward, toTarget);
    const turnDirection = cross.y > 0 ? 1 : -1;
    
    const dot = Vector3.Dot(forward, toTarget);
    
    let turnIntensity = (1.0 - dot) * this.config.turnSkill;
    turnIntensity = Math.min(turnIntensity, 0.8);
    
    return turnDirection * turnIntensity;
  }
  
private detectObstacleAhead(): { hasObstacle: boolean; direction: number } 
{
  const mesh = this.pod.getMesh();
  
  if (!mesh) 
  {
    return { hasObstacle: false, direction: 0 };
  }
  
  const position = mesh.getAbsolutePosition();
  const forward = mesh.getDirection(new Vector3(-1, 0, 0));
  forward.y = 0;
  forward.normalize();
  
  const rayDistance = 30;
  const scene = mesh.getScene();
  
  // Center ray
  const centerRay = new Ray(position, forward, rayDistance);
  const centerHit = scene.pickWithRay(centerRay, (m) => m.name !== mesh.name);
  
  // Left ray (20 degrees)
  const leftAngle = -0.35;
  const leftDir = forward.clone();
  leftDir.x = forward.x * Math.cos(leftAngle) - forward.z * Math.sin(leftAngle);
  leftDir.z = forward.x * Math.sin(leftAngle) + forward.z * Math.cos(leftAngle);
  leftDir.normalize();
  
  const leftRay = new Ray(position, leftDir, rayDistance);
  const leftHit = scene.pickWithRay(leftRay, (m) => m.name !== mesh.name);
  
  // Right ray (20 degrees)
  const rightAngle = 0.35;
  const rightDir = forward.clone();
  rightDir.x = forward.x * Math.cos(rightAngle) - forward.z * Math.sin(rightAngle);
  rightDir.z = forward.x * Math.sin(rightAngle) + forward.z * Math.cos(rightAngle);
  rightDir.normalize();
  
  const rightRay = new Ray(position, rightDir, rayDistance);
  const rightHit = scene.pickWithRay(rightRay, (m) => m.name !== mesh.name);
  
  // Check distances
  const centerDist = centerHit?.hit ? centerHit.distance : Infinity;
  const leftDist = leftHit?.hit ? leftHit.distance : Infinity;
  const rightDist = rightHit?.hit ? rightHit.distance : Infinity;
  
  // If obstacle detected within 70% of ray distance
  if (centerDist < rayDistance * 0.7) 
  {
    // Turn toward clearer side
    if (leftDist > rightDist) 
    {
      return { hasObstacle: true, direction: -1 }; // Turn left
    } 
    else 
    {
      return { hasObstacle: true, direction: 1 }; // Turn right
    }
  }
  
  return { hasObstacle: false, direction: 0 };
}
  
  private calculateThrottle(currentPos: Vector3): number 
  {
    const mesh = this.pod.getMesh();
    
    if (!mesh) 
    {
      return this.config.speedMultiplier;
    }
    
    const toTarget = this.targetWaypoint.subtract(currentPos);
    toTarget.y = 0;
    toTarget.normalize();
    
    const forward = mesh.getDirection(new Vector3(-1, 0, 0));
    forward.y = 0;
    forward.normalize();
    
    const alignment = Vector3.Dot(forward, toTarget);
    
    let throttle = this.config.speedMultiplier;
    
    // Only slow down in VERY sharp turns
    if (alignment < 0.5) 
    {
      throttle *= 0.85;
    }
    else if (alignment < 0.7) 
    {
      throttle *= 0.95;
    }
    
    return Math.max(0.5, throttle);
  }
  
  private checkStuck(currentPos: Vector3, deltaTime: number): void 
  {
    const moved = Vector3.Distance(currentPos, this.lastPosition);
    
    if (moved < 0.3) 
    {
      this.stuckTimer += deltaTime;
      
      if (this.stuckTimer > 2.0) 
      {
        console.error(`[AI ${this.pod.getConfig().name}] STUCK DETECTED!`);
        console.error(`  Position: (${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}, ${currentPos.z.toFixed(1)})`);
        console.error(`  Moved only: ${moved.toFixed(3)} units in 2 seconds`);
        console.error(`  Physics ID: ${this.pod.getConfig().id}`);
        
        // Try to get current speed from physics
        const speed = this.physics.getSpeed(this.pod.getConfig().id);
        console.error(`  Current speed: ${speed.toFixed(2)}`);
        
        // Jump to next waypoint
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.getWaypointCount();
        this.stuckTimer = 0;
        
        console.warn(`  Skipping to waypoint ${this.currentWaypointIndex}`);
      }
    } 
    else 
    {
      this.stuckTimer = 0;
    }
    
    this.lastPosition = currentPos.clone();
  }
  
  public getPod(): RacerPod 
  {
    return this.pod;
  }
  
  public setEnabled(enabled: boolean): void 
  {
    this.enabled = enabled;
    
    if (enabled) 
    {
      console.log(`[AI ${this.pod.getConfig().name}] Enabled - ready to race!`);
    }
    else 
    {
      console.log(`[AI ${this.pod.getConfig().name}] Disabled - waiting for countdown`);
    }
  }
  
  public isEnabled(): boolean 
  {
    return this.enabled;
  }
  
  public dispose(): void 
  {
    // Cleanup if needed
  }
}