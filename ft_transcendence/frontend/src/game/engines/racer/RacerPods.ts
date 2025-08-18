// Simple Pod Entity with Movement

import { 
  Scene,
  AbstractMesh,
  Vector3,
  TransformNode
} from '@babylonjs/core';
import { AssetManager } from '../../managers/AssetManager';
import { PodConfig } from '../../utils/PodConfig';

export class RacerPod 
{
  private scene: Scene;
  private config: PodConfig;
  private assetManager: AssetManager;
  private rootNode: TransformNode | null = null;
  private mesh: AbstractMesh | null = null;
  private isLoaded: boolean = false;
  
  // Movement state
  private position: Vector3 = Vector3.Zero();
  private rotation: Vector3 = Vector3.Zero();
  private velocity: Vector3 = Vector3.Zero();
  private moveSpeed: number = 0.5;
  private rotationSpeed: number = 0.03;
  
  // Callbacks
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

  // Load the 3D model using custom AssetManager
  public async loadModel(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }
    
    console.log(`Loading pod model: ${this.config.modelPath}`);
    
    try 
    {
      // Parse model path into path and filename
      const lastSlashIndex = this.config.modelPath.lastIndexOf('/');
      const path = this.config.modelPath.substring(0, lastSlashIndex + 1);
      const filename = this.config.modelPath.substring(lastSlashIndex + 1);
      
      console.log(`Pod asset path: ${path}, filename: ${filename}`);
      
      // Configure AssetManager
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
            console.log('✅ Pod asset loaded, setting up mesh...');
            this.setupMesh();
            this.isLoaded = true;
            if (this.onLoaded) 
            {
              this.onLoaded(this);
            }
          },
          onError: (errors) => 
          {
            console.error('❌ Pod asset loading failed:', errors);
            this.createFallbackPod();
            if (this.onLoadingError) 
            {
              this.onLoadingError(errors.join(', '));
            }
          }
        });

      // Start loading
      await this.assetManager.load();
      
    } 
    catch (error) 
    {
      console.error(`❌ Failed to load pod: ${error}`);
      this.createFallbackPod();
      if (this.onLoadingError) 
      {
        this.onLoadingError(error as string);
      }
    }
  }

private setupMesh(): void 
{
  const meshes = this.assetManager.getMesh(this.config.id);
  
  if (!meshes || meshes.length === 0) 
  {
    console.error('No meshes found in AssetManager');
    this.createFallbackPod();
    return;
  }
  
  console.log(`🔍 Pod: ${this.config.name} has ${meshes.length} meshes`);
  
  // Create root node
  this.rootNode = new TransformNode(`pod_${this.config.id}`, this.scene);
  
  if (meshes.length === 1) {
    // Single mesh
    this.mesh = meshes[0];
    this.mesh.parent = this.rootNode;
    
    // Reset transforms
    this.mesh.position = Vector3.Zero();
    this.mesh.rotation = Vector3.Zero();
    this.mesh.scaling = new Vector3(1, 1, 1);
    this.mesh.rotationQuaternion = null;
    
  } else {
    // Multiple meshes
    import('@babylonjs/core').then(({ Mesh }) => {
      console.log(`🔄 Merging ${meshes.length} meshes...`);
      
      // Reset all mesh transforms first
      meshes.forEach(mesh => {
        mesh.position = Vector3.Zero();
        mesh.rotation = Vector3.Zero();
        mesh.scaling = new Vector3(1, 1, 1);
        mesh.rotationQuaternion = null;
      });
      
      try {
        // Filter valid meshes
        const validMeshes = meshes.filter(mesh => {
          if (!(mesh instanceof Mesh)) return false;
          const positions = mesh.getVerticesData('position');
          return positions && positions.length > 0;
        }) as any[];
        
        console.log(`📋 Found ${validMeshes.length} valid meshes for merging`);
        
        if (validMeshes.length > 1) {
          // Use 32-bit indices for large meshes
          this.mesh = Mesh.MergeMeshes(validMeshes, true, true, undefined, false, false);
          
          if (this.mesh) {
            this.mesh.name = `merged_${this.config.id}`;
            this.mesh.parent = this.rootNode;
            console.log(`✅ Successfully merged ${validMeshes.length} meshes`);
          } else {
            throw new Error('Merge returned null');
          }
        } else {
          throw new Error('Not enough valid meshes to merge');
        }
      } catch (error) {
        console.warn(`⚠️ Merge failed: ${error}, using parent approach`);
        // Fallback: parent all meshes to root
        meshes.forEach(mesh => {
          mesh.parent = this.rootNode;
        });
        this.mesh = meshes[0];
        console.log(`🔗 Parented ${meshes.length} meshes to root node`);
      }
    });
  }
  
  // Set root node transforms
  this.rootNode.position = Vector3.Zero();
  this.rootNode.rotation = Vector3.Zero();
  this.rootNode.scaling = new Vector3(1, 1, 1);
  
  // Initialize position state
  this.position = this.rootNode.position.clone();
  this.rotation = this.rootNode.rotation.clone();
  
  console.log(`✅ Pod setup complete: ${this.config.name}`);
}

  private createFallbackPod(): void 
  {
    console.log('Creating fallback pod box...');
    
    import('@babylonjs/core').then(({ CreateBox, StandardMaterial, Color3 }) => 
    {
      this.rootNode = new TransformNode(`pod_${this.config.id}`, this.scene);
      this.mesh = CreateBox(`fallback_${this.config.id}`, { 
        width: 3, height: 1, depth: 1 
      }, this.scene);
      
      this.mesh.parent = this.rootNode;
      
      // Simple material
      const material = new StandardMaterial(`mat_${this.config.id}`, this.scene);
      material.diffuseColor = new Color3(0.5, 0.3, 0.8); // Purple
      this.mesh.material = material;
      
      // Initialize position state
      this.position = this.rootNode.position.clone();
      this.rotation = this.rootNode.rotation.clone();
      
      this.isLoaded = true;
      if (this.onLoaded) 
      {
        this.onLoaded(this);
      }
    });
  }

  // ===== MOVEMENT METHODS =====

  // Move pod based on input direction
  public move(direction: { x: number; y: number; z: number }): void 
  {
    if (!this.rootNode) return;

    // Create movement vector
    const moveVector = new Vector3(direction.x, direction.y, direction.z);
    moveVector.scaleInPlace(this.moveSpeed);

    // Apply movement relative to pod's current rotation
    const rotationMatrix = this.rootNode.getWorldMatrix().getRotationMatrix();
    const localMovement = Vector3.TransformCoordinates(moveVector, rotationMatrix);

    // Update position
    this.position.addInPlace(localMovement);
    this.rootNode.position = this.position.clone();

    // Update velocity for future physics integration
    this.velocity = localMovement;
  }

  // Rotate pod based on input
  public rotate(deltaX: number, deltaY: number): void 
  {
    if (!this.rootNode) return;

    // Apply rotation
    this.rotation.y += deltaX * this.rotationSpeed; // Yaw (left/right)
    this.rotation.x += deltaY * this.rotationSpeed; // Pitch (up/down)

    // Clamp pitch rotation
    this.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.rotation.x));

    // Apply to root node
    this.rootNode.rotation = this.rotation.clone();
  }

  // Set pod position directly
  public setPosition(position: Vector3): void 
  {
    this.position = position.clone();
    if (this.rootNode) 
    {
      this.rootNode.position = this.position.clone();
    }
  }

  // Set pod rotation directly
  public setRotation(rotation: Vector3): void 
  {
    this.rotation = rotation.clone();
    if (this.rootNode) 
    {
      this.rootNode.rotation = this.rotation.clone();
    }
  }

  // Get pod position
  public getPosition(): Vector3 
  {
    return this.position.clone();
  }

  // Get pod rotation
  public getRotation(): Vector3 
  {
    return this.rotation.clone();
  }

  // Get forward direction vector
  public getForwardDirection(): Vector3 
  {
    if (!this.rootNode) return new Vector3(0, 0, -1);
    
    // Get forward direction based on current rotation
    const forward = new Vector3(0, 0, -1);
    const rotationMatrix = this.rootNode.getWorldMatrix().getRotationMatrix();
    return Vector3.TransformNormal(forward, rotationMatrix).normalize();
  }

  // Get camera target position (behind the pod for 3rd person view)
  public getCameraTargetPosition(): Vector3 
  {
    if (!this.rootNode) return Vector3.Zero();

    const forward = this.getForwardDirection();
    const backward = forward.scale(-1);
    
    // Position camera behind and above the pod
    const cameraOffset = backward.scale(8).add(new Vector3(0, 3, 0));
    return this.position.add(cameraOffset);
  }

  // Get camera look-at position (slightly ahead of pod)
  public getCameraLookAtPosition(): Vector3 
  {
    if (!this.rootNode) return Vector3.Zero();

    const forward = this.getForwardDirection();
    // Look slightly ahead of the pod
    return this.position.add(forward.scale(2)).add(new Vector3(0, 1, 0));
  }

  // Get current velocity
  public getVelocity(): Vector3 
  {
    return this.velocity.clone();
  }

  // Set velocity directly (for future physics integration)
  public setVelocity(velocity: Vector3): void 
  {
    this.velocity = velocity.clone();
  }

  // ===== MOVEMENT SETTINGS =====

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

  // ===== EXISTING METHODS =====

  // Get root node for camera targeting
  public getRootNode(): TransformNode | null 
  {
    return this.rootNode;
  }

  public isReady(): boolean 
  {
    return this.isLoaded;
  }

  public getConfig(): PodConfig 
  {
    return this.config;
  }

  // Cleanup
  public dispose(): void 
  {
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
  }
}