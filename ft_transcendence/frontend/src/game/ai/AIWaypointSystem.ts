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
    
    this.waypoints = checkpoints.map((checkpoint, index) => 
    ({
      id: index,
      position: checkpoint.position.clone(),
      radius: 30
    }));
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