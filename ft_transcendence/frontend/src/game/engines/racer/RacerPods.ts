import { 
  Scene,
  AbstractMesh,
  Mesh,
  Vector3,
  Quaternion
} from '@babylonjs/core';
import { AssetManager } from '../../managers/AssetManager';
import { PodConfig } from '../../utils/PodConfig';
import { RacerPhysics } from './RacerPhysics';
import { RacerScene } from './RacerScene';

export class RacerPod 
{
  private scene: Scene;
  private config: PodConfig;
  private assetManager: AssetManager;
  private mesh: AbstractMesh | null = null;
  private isLoaded: boolean = false;
  
  private racerPhysics: RacerPhysics | null = null;
  private physicsEnabled: boolean = false;

  private currentCheckpointIndex: number = 0;
  private lastPassedCheckpointIndex: number = -1;
  private checkpointsPassed: boolean[] = [];
  private racerScene: RacerScene | null = null;
  private startPosition: Vector3 | null = null;

  private currentLap: number = 1;
  private totalLaps: number = 3;
  private lapStartTime: number = 0;
  private lapTimes: number[] = [];
  private raceStartTime: number = 0;
  private isRaceFinished: boolean = false;
  private readonly MIN_CHECKPOINTS_FOR_LAP = 10;

  public onLoaded?: (pod: RacerPod) => void;
  public onLoadingProgress?: (progress: number) => void;
  public onLoadingError?: (error: string) => void;

  constructor(scene: Scene, config: PodConfig) 
  {
    this.scene = scene;
    this.config = config;
    this.assetManager = new AssetManager(this.scene);
  }


  public async loadModel(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }

    try 
    {
      const lastSlashIndex = this.config.modelPath.lastIndexOf('/');
      const path = this.config.modelPath.substring(0, lastSlashIndex + 1);
      const filename = this.config.modelPath.substring(lastSlashIndex + 1);
      
      this.assetManager
        .addMeshAsset({
          id: this.config.id,
          type: 'mesh',
          path: path,
          filename: filename
        })
        .setCallbacks({
          onProgress: (progress) => 
          {
            if (this.onLoadingProgress) 
            {
              this.onLoadingProgress(progress.percentage);
            }
          },
          onSuccess: () => 
          {
            this.setupPod();
          },
          onError: (errors) => 
          {
            console.error('Pod loading failed:', errors);
            if (this.onLoadingError) 
            {
              this.onLoadingError(errors.join(', '));
            }
          }
        });

      await this.assetManager.load();
      
    } 
    catch (error) 
    {
      console.error('Pod model loading failed:', error);
    }
  }

  private setupPod(): void 
  {
    const loadedMesh = this.assetManager.getFirstMesh(this.config.id);
    
    if (loadedMesh) 
    {
      this.mesh = loadedMesh;
            
      this.isLoaded = true;
      if (this.onLoaded) 
      {
        this.onLoaded(this);
      }
    } 
    else 
    {
      console.warn('No mesh found in loaded assets');
    }
  }

  public enablePhysics(racerPhysics: RacerPhysics, initialPosition?: Vector3): void
  {
    if (!this.mesh || !this.isLoaded) 
    {
      throw new Error(`Cannot enable physics: pod not loaded - ${this.config.name}`);
    }

    if (!racerPhysics.isPhysicsReady()) 
    {
      throw new Error('Physics system not ready');
    }

    this.racerPhysics = racerPhysics;
    
    if (!this.mesh.rotationQuaternion) 
    {
      this.mesh.rotationQuaternion = Quaternion.Identity();
    }
    
    this.racerPhysics.createPod(this.mesh as Mesh, this.config.id, this, initialPosition);
    this.physicsEnabled = true;
    if (initialPosition) 
    {
      this.startPosition = initialPosition.clone();
    }
  }

  public disablePhysics(): void 
  {
    if (this.racerPhysics && this.physicsEnabled) 
    {
      this.racerPhysics.removePod(this.config.id);
    }
    
    this.racerPhysics = null;
    this.physicsEnabled = false;
  }

  public initializeCheckpoints(racerScene: RacerScene, totalLaps: number = 3): void 
  {
    this.racerScene = racerScene;
    const checkpointCount = racerScene.getCheckpointCount();
    this.checkpointsPassed = new Array(checkpointCount).fill(false);
    this.currentCheckpointIndex = 0;
    this.lastPassedCheckpointIndex = -1;

    this.currentLap = 1;
    this.totalLaps = totalLaps;
    this.raceStartTime = Date.now();
    this.lapStartTime = this.raceStartTime;
    this.lapTimes = [];
    this.isRaceFinished = false;
  }

public checkCheckpointCollision(): number | null
{
  if (!this.racerScene || this.isRaceFinished || !this.mesh) return null;
  
  const podMesh = this.mesh as Mesh;
  const podPos = podMesh.getAbsolutePosition();
  const CHECKPOINT_RADIUS = 30;
  
  for (let i = 0; i < this.racerScene.getCheckpointCount(); i++)
  {
    const checkpoints = this.racerScene.getCheckpoints();
    const checkpoint = checkpoints[i];
    const isStartLine = checkpoint.name.toLowerCase() === 'start_line';
    
    if (!isStartLine && this.checkpointsPassed[i]) continue;
    
    const distance = Vector3.Distance(podPos, checkpoint.position);
    if (distance > CHECKPOINT_RADIUS) continue;
    
    const checkpointMesh = this.racerScene.getCheckpointMesh(i);
    if (!checkpointMesh) continue;
    
    if (isStartLine)
    {
      const passedCount = this.getPassedCheckpointCount();
      
      if (passedCount >= this.MIN_CHECKPOINTS_FOR_LAP)
      {
        this.completeLap();
        return i;
      }
    }
    else if (podMesh.intersectsMesh(checkpointMesh, false))
    {
      this.checkpointsPassed[i] = true;
      this.lastPassedCheckpointIndex = i;
      return i;
    }
  }
  
  return null;
}


  private getPassedCheckpointCount(): number 
  {
    return this.checkpointsPassed.filter(passed => passed).length;
  }

private completeLap(): void 
{
  const currentTime = Date.now();
  const lapTime = currentTime - this.lapStartTime;
  
  this.lapTimes.push(lapTime);
  
  if ((window as any).racerUIManager) 
  {
    (window as any).racerUIManager.onLapComplete(this.currentLap, lapTime);
  }
  else
  {
    console.error('racerUIManager not found on window!');
  }
  
  this.currentLap++;
  
  if (this.currentLap > this.totalLaps) 
  {
    this.finishRace();
  }
  else
  {
    this.resetCheckpointProgress();
    this.lapStartTime = currentTime;
    
    if ((window as any).racerUIManager) 
    {
      (window as any).racerUIManager.updateLap(this.currentLap);
    }
  }
}

  private finishRace(): void 
  {
    this.isRaceFinished = true;
    const totalTime = Date.now() - this.raceStartTime;

    // Show finish screen through UI manager
    if ((window as any).racerUIManager) 
    {
      (window as any).racerUIManager.showRaceFinishScreen({
        position: 1,
        totalTime: this.formatTime(totalTime),
        lapTimes: this.lapTimes,
        bestLap: this.getBestLapTime(),
        playerName: 'Player',
        avatarUrl: (window as any).playerAvatarUrl || '/assets/images/default-avatar.jpeg'
      });
    }
  }

  public resetCheckpointProgress(): void 
  {
    this.checkpointsPassed.fill(false);
    this.currentCheckpointIndex = 0;
  }

  private formatTime(milliseconds: number): string 
  {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  public getRaceProgress(): number 
  {
    if (this.checkpointsPassed.length === 0) return 0;
    
    const passedCount = this.checkpointsPassed.filter(passed => passed).length;
    return (passedCount / this.checkpointsPassed.length) * 100;
  }

  public getNextCheckpointPosition(): Vector3 | null 
  {
    if (!this.racerScene) return null;
    return this.racerScene.getCheckpointPosition(this.currentCheckpointIndex);
  }

  public getRespawnPosition(): Vector3 | null 
  {
    if (!this.racerScene) 
    {
      return null;
    }
    
    let respawnIndex = this.lastPassedCheckpointIndex;
    
    // If no checkpoints passed yet, use start position
    if (respawnIndex < 0 && this.startPosition) 
    {
      const safeStartPos = this.startPosition.clone();
      safeStartPos.y += 5;
      return safeStartPos;
    }
    
    // Use last passed checkpoint
    const respawnPos = this.racerScene.getCheckpointPosition(respawnIndex);
    if (respawnPos) 
    {
      const safeRespawnPos = respawnPos.clone();
      safeRespawnPos.y += 5;
      return safeRespawnPos;
    }
    
    return null;
  }

public shouldRespawnPlayer(playerPosition: Vector3): boolean 
{
  if (playerPosition.y < -50) 
  {
    return true;
  }
  
  return false;
}

  public getCheckpointInfo(): { current: number; total: number; progress: number } 
  {
    return {
      current: this.currentCheckpointIndex,
      total: this.checkpointsPassed.length,
      progress: this.getRaceProgress()
    };
  }

  public setPosition(position: Vector3): void 
  {
    if (this.mesh) 
    {
      this.mesh.position = position.clone();
    }
  }

  public getPosition(): Vector3 
  {
    if (this.mesh) 
    {
      return this.mesh.position.clone();
    }
    return Vector3.Zero();
  }


  public getMesh(): AbstractMesh | null 
  {
    return this.mesh;
  }

  public getConfig(): PodConfig 
  {
    return this.config;
  }

  public getCurrentLap(): number 
  {
    return this.currentLap;
  }

  public getTotalLaps(): number 
  {
    return this.totalLaps;
  }

  public getLapTimes(): number[] 
  {
    return [...this.lapTimes];
  }

  public getBestLapTime(): number | null 
  {
    return this.lapTimes.length > 0 ? Math.min(...this.lapTimes) : null;
  }

  public getTotalRaceTime(): number 
  {
    return Date.now() - this.raceStartTime;
  }

  public isRaceComplete(): boolean 
  {
    return this.isRaceFinished;
  }

  public getRaceResults(): {
    totalTime: number;
    lapTimes: number[];
    bestLap: number | null;
    averageLapTime: number | null;
  } 
  {
    const totalTime = Date.now() - this.raceStartTime;
    const bestLap = this.getBestLapTime();
    const averageLapTime = this.lapTimes.length > 0 
      ? this.lapTimes.reduce((sum, time) => sum + time, 0) / this.lapTimes.length 
      : null;
    
    return {
      totalTime,
      lapTimes: [...this.lapTimes],
      bestLap,
      averageLapTime
    };
  }

  public dispose(): void 
  {
    this.disablePhysics();
    
    if (this.assetManager) 
    {
      this.assetManager.dispose();
    }
    
    this.mesh = null;
    this.isLoaded = false;
    this.onLoaded = undefined;
    this.onLoadingProgress = undefined;
    this.onLoadingError = undefined;
  }
}