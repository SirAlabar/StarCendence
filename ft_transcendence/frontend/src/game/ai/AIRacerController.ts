import { Vector3 } from '@babylonjs/core';
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
    this.currentWaypointIndex = waypoints.getClosestWaypoint(startPos);
    
    const nextWaypoint = waypoints.getNextWaypoint(startPos, this.currentWaypointIndex);
    this.targetWaypoint = nextWaypoint.position;
    this.lastPosition = startPos.clone();
  }
  
  public update(deltaTime: number): void 
  {
    const podPos = this.pod.getPosition();
    
    const waypointUpdate = this.waypoints.getNextWaypoint(podPos, this.currentWaypointIndex);
    
    if (waypointUpdate.index !== this.currentWaypointIndex) 
    {
      this.currentWaypointIndex = waypointUpdate.index;
    }
    
    this.targetWaypoint = waypointUpdate.position;
    
    const steering = this.calculateSteering(podPos);
    const throttle = this.calculateThrottle(podPos);
    
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
    
    const toTarget = this.targetWaypoint.subtract(currentPos);
    toTarget.y = 0;
    toTarget.normalize();
    
    const forward = mesh.getDirection(new Vector3(-1, 0, 0));
    forward.y = 0;
    forward.normalize();
    
    const cross = Vector3.Cross(forward, toTarget);
    const turnDirection = cross.y > 0 ? 1 : -1;
    
    const dot = Vector3.Dot(forward, toTarget);
    const turnIntensity = (1.0 - dot) * this.config.turnSkill;
    
    return turnDirection * turnIntensity;
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
    
    if (alignment < 0.7) 
    {
      throttle *= 0.75;
    }
    
    return Math.max(0.3, throttle);
  }
  
  private checkStuck(currentPos: Vector3, deltaTime: number): void 
  {
    const moved = Vector3.Distance(currentPos, this.lastPosition);
    
    if (moved < 0.3) 
    {
      this.stuckTimer += deltaTime;
      
      if (this.stuckTimer > 2.0) 
      {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.getWaypointCount();
        this.stuckTimer = 0;
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
  
  public dispose(): void 
  {
    // Cleanup if needed
  }
}