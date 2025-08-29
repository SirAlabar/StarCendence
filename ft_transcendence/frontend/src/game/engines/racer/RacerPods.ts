import { 
  Scene,
  AbstractMesh,
  Mesh,
  Vector3,
  TransformNode,
  Quaternion
} from '@babylonjs/core';
import { AssetManager } from '../../managers/AssetManager';
import { PodConfig } from '../../utils/PodConfig';
import { RacerPhysics } from './RacerPhysics';

export class RacerPod 
{
  private scene: Scene;
  private config: PodConfig;
  private assetManager: AssetManager;
  private rootNode: TransformNode | null = null;
  private mesh: AbstractMesh | null = null;
  private isLoaded: boolean = false;
  
  // ===== Physics Integration =====
  private racerPhysics: RacerPhysics | null = null;
  private physicsEnabled: boolean = false;
  
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

  // ===== Asset Loading =====

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
      this.createFallbackPod();
    }
  }

  private setupPod(): void 
  {
    const loadedMesh = this.assetManager.getFirstMesh(this.config.id);
    
    if (loadedMesh) 
    {
      this.rootNode = new TransformNode(`pod_${this.config.id}`, this.scene);
      this.mesh = loadedMesh;
      this.mesh.parent = this.rootNode;
      
      console.log('Pod asset loaded successfully');
      
      this.isLoaded = true;
      if (this.onLoaded) 
      {
        this.onLoaded(this);
      }
    } 
    else 
    {
      console.warn('No mesh found in loaded assets, creating fallback');
      this.createFallbackPod();
    }
  }

  private createFallbackPod(): void 
  {
    import('@babylonjs/core').then(({ CreateBox, StandardMaterial, Color3 }) => 
    {
      this.rootNode = new TransformNode(`pod_${this.config.id}`, this.scene);
      this.mesh = CreateBox(`fallback_${this.config.id}`, { 
        width: 3, height: 1, depth: 1 
      }, this.scene);
      
      this.mesh.parent = this.rootNode;
      
      const material = new StandardMaterial(`mat_${this.config.id}`, this.scene);
      material.diffuseColor = new Color3(0.5, 0.3, 0.8);
      this.mesh.material = material;
      
      this.isLoaded = true;
      if (this.onLoaded) 
      {
        this.onLoaded(this);
      }
    });
  }

  // ===== Physics Integration =====

  public enablePhysics(racerPhysics: RacerPhysics): void 
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
    
    this.racerPhysics.createPod(this.mesh as Mesh, this.config.id);
    this.physicsEnabled = true;
    console.log(`Physics enabled for pod: ${this.config.id}`);
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

  // ===== Position and Rotation =====

  public setPosition(position: Vector3): void 
  {
    if (this.rootNode) 
    {
      this.rootNode.position = position.clone();
    }

    if (this.physicsEnabled && this.racerPhysics) 
    {
      this.racerPhysics.reset(this.config.id, position);
    }
  }

  public getPosition(): Vector3 
  {
    if (this.rootNode) 
    {
      return this.rootNode.position.clone();
    }
    return Vector3.Zero();
  }

  // ===== Status Methods =====

  public getRootNode(): TransformNode | null 
  {
    return this.rootNode;
  }

  public getMesh(): AbstractMesh | null 
  {
    return this.mesh;
  }

  public isPodReady(): boolean 
  {
    return this.isLoaded;
  }

  public getConfig(): PodConfig 
  {
    return this.config;
  }

  // ===== Cleanup =====

  public dispose(): void 
  {
    console.log(`Disposing RacerPod: ${this.config.name}`);
    
    this.disablePhysics();
    
    if (this.assetManager) 
    {
      this.assetManager.dispose();
    }
    
    if (this.rootNode) 
    {
      this.rootNode.dispose();
      this.rootNode = null;
    }
    
    this.mesh = null;
    this.isLoaded = false;
    this.onLoaded = undefined;
    this.onLoadingProgress = undefined;
    this.onLoadingError = undefined;
  }
}