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
  private lastCheckpointPosition: Vector3 | null = null;
  private startPosition: Vector3 | null = null;

  private lastDebugTime: number = 0;
  private debugInterval: number = 2000; 


  public onLoaded?: (pod: RacerPod) => void;
  public onLoadingProgress?: (progress: number) => void;
  public onLoadingError?: (error: string) => void;

  constructor(scene: Scene, config: PodConfig) 
  {
    this.scene = scene;
    this.config = config;
    this.assetManager = new AssetManager(this.scene);
    console.log(`Creating pod: ${config.name}`);
  }


  public async loadModel(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }
    
    console.log(`Loading pod model: ${this.config.modelPath}`);
    
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
      
      console.log('Pod asset loaded successfully');
      
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
    console.log(`Physics enabled for pod: ${this.config.id} at position: ${initialPosition}`);
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

  public initializeCheckpoints(racerScene: RacerScene): void 
  {
    this.racerScene = racerScene;
    const checkpointCount = racerScene.getCheckpointCount();
    this.checkpointsPassed = new Array(checkpointCount).fill(false);
    this.currentCheckpointIndex = 0;
    this.lastPassedCheckpointIndex = -1;
    
    console.log(`Pod ${this.config.id} initialized with ${checkpointCount} checkpoints`);
  }


  public checkCheckpointCollision(playerPosition: Vector3): number | null
  {
    if (!this.racerScene) 
    {
      return null;
    }
  
    const checkpointRadius = 15.0;
    const totalCheckpoints = this.checkpointsPassed.length;
  
    const checkRange = 5;
    let foundCheckpoint: number | null = null;
    let closestDistance = Infinity;
  
    for (let i = 0; i < checkRange; i++) 
    {
      const checkpointIndex = (this.currentCheckpointIndex + i) % totalCheckpoints;
      const checkpointPos = this.racerScene.getCheckpointPosition(checkpointIndex);
    
      if (!checkpointPos) 
      {
        continue;
      }
    
      const distance = Vector3.Distance(playerPosition, checkpointPos);
    
      if (distance <= checkpointRadius && distance < closestDistance) 
      {
        foundCheckpoint = checkpointIndex;
        closestDistance = distance;
      }
    }
    
    if (foundCheckpoint !== null) 
    {
      // const skippedCount = foundCheckpoint - this.currentCheckpointIndex;
    
      // if (skippedCount > 0) 
      // {
      //   console.log(`Pod ${this.config.id} skipped ${skippedCount} checkpoints (${this.currentCheckpointIndex} → ${foundCheckpoint})`);
      // }
    
      // Mark all checkpoints up to and including the found one as passed
      for (let i = this.currentCheckpointIndex; i <= foundCheckpoint; i++) 
      {
        this.checkpointsPassed[i] = true;
      }
    
      // Store this checkpoint position as last known position for respawn
      const checkpointPos = this.racerScene.getCheckpointPosition(foundCheckpoint);
      if (checkpointPos) 
      {
        this.lastCheckpointPosition = checkpointPos.clone();
      }
    
      // Update last passed checkpoint for respawning
      this.lastPassedCheckpointIndex = foundCheckpoint;
    
      // Move to next checkpoint after the found one
      this.currentCheckpointIndex = (foundCheckpoint + 1) % totalCheckpoints;
    
      // const checkpointName = this.racerScene.getCheckpointName(foundCheckpoint);
      // console.log(`Pod ${this.config.id} passed checkpoint ${foundCheckpoint + 1} (${checkpointName})`);
    
      return foundCheckpoint;
    }
    
    return null;
  }

  public isLapCompleted(): boolean 
  {
    return this.currentCheckpointIndex === 0 && this.checkpointsPassed.some(passed => passed);
  }

  public resetCheckpointProgress(): void 
  {
    this.checkpointsPassed.fill(false);
    this.currentCheckpointIndex = 0;
    console.log(`Pod ${this.config.id} checkpoint progress reset for new lap`);
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
    console.log(`Pod ${this.config.id} fell into void at Y: ${playerPosition.y}`);
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

  public dispose(): void 
  {
    console.log(`Disposing RacerPod: ${this.config.name}`);
    
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