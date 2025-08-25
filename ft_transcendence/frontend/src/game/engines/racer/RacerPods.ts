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
  
  private position: Vector3 = Vector3.Zero();
  private rotation: Vector3 = Vector3.Zero();
  private velocity: Vector3 = Vector3.Zero();
  private moveSpeed: number = 0.5;
  private rotationSpeed: number = 0.03;
  
  // ===== PHYSICS INTEGRATION =====
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
      
      console.log(`Pod asset path: ${path}, filename: ${filename}`);
      
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
            console.log(`Pod loading: ${progress.percentage}%`);
            if (this.onLoadingProgress) 
            {
              this.onLoadingProgress(progress.percentage);
            }
          },
          onSuccess: () => 
          {
            console.log('Pod asset loaded');
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
      
      this.position = this.rootNode.position.clone();
      this.rotation = this.rootNode.rotation.clone();
      
      console.log('Pod asset loaded');
      
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
      
      this.position = this.rootNode.position.clone();
      this.rotation = this.rootNode.rotation.clone();
      
      this.isLoaded = true;
      if (this.onLoaded) 
      {
        this.onLoaded(this);
      }
    });
  }

  // ===== PHYSICS INTEGRATION METHODS =====

  public enablePhysics(racerPhysics: RacerPhysics): void 
  {
    if (!this.mesh || !this.isLoaded) 
    {
      console.warn(`Cannot enable physics: pod not loaded - ${this.config.name}`);
      return;
    }

    if (!racerPhysics.isPhysicsReady()) 
    {
      console.warn('Cannot enable physics: physics system not ready');
      return;
    }

    this.racerPhysics = racerPhysics;
    
    if (!this.mesh.rotationQuaternion) 
    {
      this.mesh.rotationQuaternion = Quaternion.Identity();
    }
    
    try 
    {
      this.racerPhysics.createPod(this.mesh as Mesh, this.config.id);
      this.physicsEnabled = true;
      console.log(`Physics enabled for pod: ${this.config.id}`);
    } 
    catch (error) 
    {
      console.error(`Failed to enable physics for ${this.config.id}:`, error);
      this.racerPhysics = null;
      this.physicsEnabled = false;
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

  // ===== UPDATED MOVEMENT METHOD =====

  public move(direction: { x: number; y: number; z: number }): void 
  {
    console.log(`🚀 RacerPod.move() called - Pod: ${this.config.name}`);
    console.log(`🚀 Direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)})`);
    console.log(`🚀 Is loaded: ${this.isLoaded}`);
    console.log(`🚀 Physics enabled: ${this.physicsEnabled}`);
    console.log(`🚀 Has racerPhysics: ${!!this.racerPhysics}`);

    if (!this.isLoaded) 
    {
      console.warn(`🚀 Pod not loaded, skipping movement`);
      return;
    }

    if (this.physicsEnabled && this.racerPhysics) 
    {
      console.log(`🚀 Using physics movement`);
      const racingInput = 
      {
        x: direction.x,
        z: direction.z
      };

      console.log(`🚀 Calling racerPhysics.movePod() with input: (${racingInput.x.toFixed(2)}, ${racingInput.z.toFixed(2)})`);
      this.racerPhysics.movePod(this.config.id, racingInput);
      
      if (this.rootNode) 
      {
        this.position = this.rootNode.position.clone();
      }
    }
    else 
    {
      console.log(`🚀 Using static movement`);
      if (!this.rootNode) 
      {
        console.warn(`🚀 No rootNode for static movement`);
        return;
      }

      const moveVector = new Vector3(direction.x, direction.y, direction.z);
      moveVector.scaleInPlace(this.moveSpeed);

      const rotationMatrix = this.rootNode.getWorldMatrix().getRotationMatrix();
      const localMovement = Vector3.TransformCoordinates(moveVector, rotationMatrix);

      this.position.addInPlace(localMovement);
      this.rootNode.position = this.position.clone();
      this.velocity = localMovement;
      
      console.log(`🚀 Static movement applied to ${this.config.name}`);
    }
  }

  public rotate(deltaX: number, deltaY: number): void 
  {
    if (!this.rootNode) 
    {
      return;
    }

    this.rotation.y += deltaX * this.rotationSpeed;
    this.rotation.x += deltaY * this.rotationSpeed;

    // Clamp vertical rotation
    this.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.rotation.x));

    this.rootNode.rotation = this.rotation.clone();
  }

  // ===== POSITION/ROTATION METHODS =====

  public setPosition(position: Vector3): void 
  {
    this.position = position.clone();
    if (this.rootNode) 
    {
      this.rootNode.position = this.position.clone();
    }

    // If physics enabled, reset physics state to new position
    if (this.physicsEnabled && this.racerPhysics) 
    {
      this.racerPhysics.reset(this.config.id, position);
    }
  }

  public setRotation(rotation: Vector3): void 
  {
    this.rotation = rotation.clone();
    if (this.rootNode) 
    {
      this.rootNode.rotation = this.rotation.clone();
    }

    // If physics enabled, reset physics rotation too
    if (this.physicsEnabled && this.racerPhysics) 
    {
      this.racerPhysics.reset(this.config.id, this.position, rotation);
    }
  }

  public getPosition(): Vector3 
  {
    if (this.rootNode) 
    {
      return this.rootNode.position.clone();
    }
    return this.position.clone();
  }

  public getRotation(): Vector3 
  {
    if (this.rootNode) 
    {
      return this.rootNode.rotation.clone();
    }
    return this.rotation.clone();
  }

  public getForwardDirection(): Vector3 
  {
    if (!this.rootNode) 
    {
      return new Vector3(0, 0, -1);
    }
    
    const forward = new Vector3(0, 0, -1);
    const rotationMatrix = this.rootNode.getWorldMatrix().getRotationMatrix();
    return Vector3.TransformNormal(forward, rotationMatrix).normalize();
  }

  // ===== CAMERA HELPER METHODS =====

  public getCameraTargetPosition(): Vector3 
  {
    if (!this.rootNode) 
    {
      return Vector3.Zero();
    }

    const forward = this.getForwardDirection();
    const backward = forward.scale(-1);
    
    const cameraOffset = backward.scale(8).add(new Vector3(0, 3, 0));
    return this.getPosition().add(cameraOffset);
  }

  public getCameraLookAtPosition(): Vector3 
  {
    if (!this.rootNode) 
    {
      return Vector3.Zero();
    }

    const forward = this.getForwardDirection();
    return this.getPosition().add(forward.scale(2)).add(new Vector3(0, 1, 0));
  }

  // ===== VELOCITY AND SPEED =====

  public getVelocity(): Vector3 
  {
    if (this.physicsEnabled && this.racerPhysics) 
    {
      // Get actual physics velocity
      const speed = this.racerPhysics.getSpeed(this.config.id);
      const forward = this.getForwardDirection();
      return forward.scale(speed);
    }
    return this.velocity.clone();
  }

  public setVelocity(velocity: Vector3): void 
  {
    this.velocity = velocity.clone();
  }

  public getSpeed(): number 
  {
    if (this.physicsEnabled && this.racerPhysics) 
    {
      return this.racerPhysics.getSpeed(this.config.id);
    }
    return this.velocity.length();
  }

  // ===== CONFIGURATION METHODS =====

  public setMoveSpeed(speed: number): void 
  {
    this.moveSpeed = Math.max(0.1, Math.min(2.0, speed));
  }

  public setRotationSpeed(speed: number): void 
  {
    this.rotationSpeed = Math.max(0.01, Math.min(0.1, speed));
  }

  public getMoveSpeed(): number 
  {
    return this.moveSpeed;
  }

  public getRotationSpeed(): number 
  {
    return this.rotationSpeed;
  }

  // ===== STATUS METHODS =====

  public getRootNode(): TransformNode | null 
  {
    return this.rootNode;
  }

  public getMesh(): AbstractMesh | null 
  {
    return this.mesh;
  }

  public isReady(): boolean 
  {
    return this.isLoaded;
  }

  public hasPhysics(): boolean 
  {
    return this.physicsEnabled;
  }

  public getConfig(): PodConfig 
  {
    return this.config;
  }

  // ===== UPDATED DISPOSE METHOD =====

  public dispose(): void 
  {
    console.log(`Disposing RacerPod: ${this.config.name}`);
    
    // Disable physics first
    this.disablePhysics();
    
    // Dispose asset manager
    if (this.assetManager) 
    {
      this.assetManager.dispose();
    }
    
    // Dispose 3D objects
    if (this.rootNode) 
    {
      this.rootNode.dispose();
      this.rootNode = null;
    }
    
    // Clear references
    this.mesh = null;
    this.isLoaded = false;
    this.onLoaded = undefined;
    this.onLoadingProgress = undefined;
    this.onLoadingError = undefined;
  }
}