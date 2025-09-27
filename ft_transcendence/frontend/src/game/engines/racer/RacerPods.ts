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
  if (!this.racerScene) return null;
  
  // Get the next expected checkpoint position
  const nextCheckpointPos = this.racerScene.getCheckpointPosition(this.currentCheckpointIndex);
  if (!nextCheckpointPos) return null;

  // Use distance-based collision instead of mesh intersection
  const distanceToCheckpoint = Vector3.Distance(playerPosition, nextCheckpointPos);
  const checkpointRadius = 15.0; // Adjust this value based on your checkpoint size
  
  if (distanceToCheckpoint <= checkpointRadius) 
  {
    // Store this checkpoint position as last known position for respawn
    this.lastCheckpointPosition = nextCheckpointPos.clone();
    
    // Mark checkpoint as passed for this pod
    this.checkpointsPassed[this.currentCheckpointIndex] = true;
    
    // Store this as last passed checkpoint for respawning
    this.lastPassedCheckpointIndex = this.currentCheckpointIndex;
    
    // Move to next checkpoint (loop back to 0 for lap completion)
    const passedCheckpointId = this.currentCheckpointIndex;
    this.currentCheckpointIndex = (this.currentCheckpointIndex + 1) % this.checkpointsPassed.length;
    
    const checkpointName = this.racerScene.getCheckpointName(passedCheckpointId);
    console.log(`Pod ${this.config.id} passed checkpoint ${passedCheckpointId} (${checkpointName})`);
    
    return passedCheckpointId;
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
      safeStartPos.y += 5; // Spawn 5 units above start position
      return safeStartPos;
    }
    
    // Use last passed checkpoint
    const respawnPos = this.racerScene.getCheckpointPosition(respawnIndex);
    if (respawnPos) 
    {
      const safeRespawnPos = respawnPos.clone();
      safeRespawnPos.y += 5; // Spawn 5 units above checkpoint
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