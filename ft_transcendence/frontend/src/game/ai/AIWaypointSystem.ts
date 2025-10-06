import { Vector3 } from '@babylonjs/core';
import { RacerScene } from '../engines/racer/RacerScene';

export interface Waypoint 
{
  id: number;
  position: Vector3;
  radius: number;
}

export class AIWaypointSystem 
{
  private waypoints: Waypoint[] = [];
  
  constructor(racerScene: RacerScene) 
  {
    const checkpoints = racerScene.getCheckpoints();
    
    console.log(`[Waypoints] Found ${checkpoints.length} checkpoints in scene`);
    
    this.waypoints = checkpoints.map((checkpoint, index) => 
    {
      // Use the checkpoint position that was already calculated correctly
      // in RacerScene.processCheckpoints() - it's already in world space
      const targetPosition = checkpoint.position.clone();
      
      console.log(`[Waypoints] Checkpoint ${index} (${checkpoint.name}):`, 
        `Position: (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
      
      return {
        id: index,
        position: targetPosition,
        radius: 7
      };
    });
    
    console.log(`[Waypoints] Generated ${this.waypoints.length} waypoints successfully`);
  }
  
  public getNextWaypoint(currentPos: Vector3, currentIndex: number): { index: number; position: Vector3 } 
  {
    const waypoint = this.waypoints[currentIndex];
    const distance = Vector3.Distance(currentPos, waypoint.position);
    
    if (distance < waypoint.radius) 
    {
      const nextIndex = (currentIndex + 1) % this.waypoints.length;
      return {
        index: nextIndex,
        position: this.waypoints[nextIndex].position.clone()
      };
    }
    
    return {
      index: currentIndex,
      position: waypoint.position.clone()
    };
  }
  
  public getClosestWaypoint(position: Vector3): number 
  {
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    this.waypoints.forEach((waypoint, index) => 
    {
      const distance = Vector3.Distance(position, waypoint.position);
      
      if (distance < closestDistance) 
      {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }
  
  public getWaypointCount(): number 
  {
    return this.waypoints.length;
  }
}