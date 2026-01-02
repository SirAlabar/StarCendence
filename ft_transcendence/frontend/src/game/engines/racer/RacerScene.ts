import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3,
  Mesh,
  SceneLoader,
  Texture,
  MeshBuilder,
  StandardMaterial,
  VertexBuffer,
  Quaternion
} from '@babylonjs/core';
import { GameCanvas } from './GameCanvas';

export interface RacerSceneConfig 
{
  trackSize?: number;
  trackSubdivisions?: number;
  wallHeight?: number;
  wallThickness?: number;
  enableFog?: boolean;
  fogColor?: Color3;
  fogDensity?: number;
}

export interface Checkpoint 
{
  id: number;
  name: string;
  position: Vector3;
  normal: Vector3;
  passed: boolean;
}

const DEFAULT_CONFIG: RacerSceneConfig = 
{
  trackSize: 5000,
  trackSubdivisions: 50,
  wallHeight: 20,        
  wallThickness: 5,      
  enableFog: true,
  fogColor: new Color3(0.7, 0.8, 0.9),
  fogDensity: 0.002
};

export class RacerScene 
{
  private gameCanvas: GameCanvas;
  private scene: Scene;
  private config: RacerSceneConfig;
  private track: AbstractMesh | null = null;
  private isLoaded: boolean = false;
  private checkpoints: Checkpoint[] = [];
  private checkpointMeshes: AbstractMesh[] = [];

  public onTrackLoaded?: (track: AbstractMesh) => void;
  public onLoadingProgress?: (percentage: number, asset: string) => void;
  public onLoadingComplete?: () => void;
  public onLoadingError?: (errors: string[]) => void;

  constructor(gameCanvas: GameCanvas, config: RacerSceneConfig = DEFAULT_CONFIG) 
  {
    this.gameCanvas = gameCanvas;
    const scene = gameCanvas.getScene();
    if (!scene) 
    {
      throw new Error('Cannot create RacerScene: GameCanvas scene not initialized');
    }
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async loadTrack(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }

    try 
    {
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(10, 'Loading babylon...');
      }

      await this.loadRacerTrack();
      this.setupSkybox();
      this.setupRacingEnvironment();
      
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(100, 'Track ready');
      }

      if (this.onLoadingComplete) 
      {
        this.onLoadingComplete();
      }
    } 
    catch (error) 
    {
      if (this.onLoadingError) 
      {
        this.onLoadingError([`Failed to load track: ${error}`]);
      }
    }
  }

  public findCollisionMesh(): AbstractMesh | null 
  {
    return (this as any).collisionMesh || null;
  }

  private async loadRacerTrack(): Promise<void> 
  {
    return new Promise((resolve, reject) => 
    {
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(30, 'Downloading polar pass model...');
      }

      SceneLoader.ImportMesh(
        "", 
        "/assets/models/racing_tracks/", 
        "polar_pass.glb", 
        this.scene, 
        (newMeshes) => 
        {
          try 
          {
            const visualMesh = newMeshes[0];
            
            let collisionMesh = null;
            for (let i = 0; i < newMeshes.length; i++) 
            {
              if (newMeshes[i].name.toLowerCase() === 'collision') 
              {
                collisionMesh = newMeshes[i];
                break;
              }
            }

            if (!collisionMesh) 
            {
              throw new Error('Collision mesh not found in GLB');
            }

            const scale = new Vector3(10, 10, 10);
            const position = new Vector3(0, -2.5, 0);
            const rotation = Vector3.Zero();
            
            visualMesh.position = position.clone();
            visualMesh.rotation = rotation.clone();
            visualMesh.scaling = scale.clone();
            
            collisionMesh.position = position.clone();
            collisionMesh.position.y += 2.5;
            collisionMesh.rotation = rotation.clone();
            collisionMesh.scaling = scale.clone();
            
            collisionMesh.visibility = 0;
            collisionMesh.isVisible = false;

            if (collisionMesh instanceof Mesh) 
            {
              const positions = collisionMesh.getVerticesData(VertexBuffer.PositionKind);
              const indices = collisionMesh.getIndices();

              if (!positions || !indices || positions.length === 0 || indices.length === 0) 
              {
                throw new Error('Collision mesh has no geometry data');
              }
            }

            this.track = visualMesh;
            (this as any).collisionMesh = collisionMesh;

            this.processCheckpoints(newMeshes, scale, position);

            if (this.onTrackLoaded) 
            {
              this.onTrackLoaded(this.track);
            }

            if (this.onLoadingProgress) 
            {
              this.onLoadingProgress(90, 'Both meshes synchronized');
            }

            this.isLoaded = true;
            resolve();
          }
          catch (error) 
          {
            reject(error);
          }
        },

        (progress) => 
        {
          if (progress.total > 0) 
          {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            
            if (this.onLoadingProgress) 
            {
              this.onLoadingProgress(30 + (percentage * 0.4), `Downloading: ${percentage}%`);
            }
          }
        },
        (_scene, message) => 
        {
          reject(new Error(`Failed to load polar pass: ${message}`));
        }
      );
    });
  }

  private setupSkybox(): void 
  {
    try 
    {
      const skybox = MeshBuilder.CreateSphere(
        "skybox", 
        { diameter: 10000, segments: 32 }, 
        this.scene
      );

      const skyboxTexture = new Texture(
        "/assets/images/backgrounds/skybox_hoth.jpg",
        this.scene
      );

      const skyboxMaterial = new StandardMaterial("skyboxMaterial", this.scene);
      
      skyboxMaterial.emissiveTexture = skyboxTexture;
      skyboxMaterial.disableLighting = true;
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.fogEnabled = false;
      
      skybox.material = skyboxMaterial;
      
      skybox.renderingGroupId = 0;
      skybox.infiniteDistance = true;
    } 
    catch (error) 
    {
      console.error('Failed to load skybox:', error);
    }
  }
  
  private processCheckpoints(meshes: AbstractMesh[], trackScale: Vector3, trackPosition: Vector3): void 
  {
    const checkpointMeshes: AbstractMesh[] = [];

    meshes.forEach((mesh) => 
    {
      const meshName = mesh.name.toLowerCase();
      
      if (meshName.startsWith('check_point') || meshName === 'start_line')
      {
        checkpointMeshes.push(mesh);
      }
    });

    if (checkpointMeshes.length === 0) 
    {
      console.warn('No checkpoint meshes found in GLB file');
      return;
    }

    checkpointMeshes.sort((a, b) => a.name.localeCompare(b.name));

    this.checkpoints = [];
    this.checkpointMeshes = [];

    checkpointMeshes.forEach((mesh, index) => 
    {
      const originalLocalPos = mesh.position.clone();
      
      const worldPosition = new Vector3(
        (originalLocalPos.x * trackScale.x) + trackPosition.x,
        (originalLocalPos.y * trackScale.y) + trackPosition.y,
        (originalLocalPos.z * trackScale.z) + trackPosition.z
      );

      const localForward = new Vector3(0, 0, 1);
      
      let checkpointNormal = localForward;
      
      if (mesh.rotationQuaternion) 
      {
        checkpointNormal = localForward.applyRotationQuaternion(mesh.rotationQuaternion);
      } 
      else if (mesh.rotation) 
      {
        const quat = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
        checkpointNormal = localForward.applyRotationQuaternion(quat);
      }
      
      checkpointNormal.normalize();
      
      const isStartLine = mesh.name.toLowerCase() === 'start_line';

      if (isStartLine) 
      {
        const bbox = mesh.getBoundingInfo().boundingBox;
        const localCenter = bbox.center;
        
        worldPosition.x = (localCenter.x * trackScale.x) + trackPosition.x;
        worldPosition.y = (localCenter.y * trackScale.y) + trackPosition.y;
        worldPosition.z = (localCenter.z * trackScale.z) + trackPosition.z;
      }

      if (!isStartLine)
      {
        mesh.visibility = 0;
        mesh.isVisible = false;
      }
      
      mesh.checkCollisions = false;

      const checkpoint: Checkpoint = {
        id: index,
        name: mesh.name,
        position: worldPosition.clone(),
        normal: checkpointNormal.clone(),
        passed: false
      };

      this.checkpoints.push(checkpoint);
      this.checkpointMeshes.push(mesh);
    });
  }

  private setupRacingEnvironment(): void 
  {
    if (this.config.enableFog && this.config.fogColor) 
    {
      this.scene.fogMode = Scene.FOGMODE_EXP;
      this.scene.fogColor = this.config.fogColor;
      this.scene.fogDensity = this.config.fogDensity || 0.002;
    }

    if (this.config.fogColor) 
    {
      this.scene.clearColor = this.config.fogColor.toColor4();
    }
  }

  public getTrack(): AbstractMesh | null 
  {
    return this.track;
  }

  public getTrackCenter(): Vector3 
  {
    if (!this.track) 
    {
      return Vector3.Zero();
    }
    return this.track.getBoundingInfo().boundingBox.center;
  }

  public getTrackBounds(): { min: Vector3; max: Vector3; size: Vector3 } 
  {
    if (!this.track) 
    {
      const defaultSize = this.config.trackSize! / 2;
      return {
        min: new Vector3(-defaultSize, -50, -defaultSize),
        max: new Vector3(defaultSize, 50, defaultSize),
        size: new Vector3(this.config.trackSize!, 100, this.config.trackSize!)
      };
    }

    const boundingBox = this.track.getBoundingInfo().boundingBox;
    const min = boundingBox.minimum.clone();
    const max = boundingBox.maximum.clone();
    
    return {
      min,
      max,
      size: max.subtract(min)
    };
  }

  public getCheckpoints(): Checkpoint[] 
  {
    return [...this.checkpoints];
  }

  public getCheckpointCount(): number 
  {
    return this.checkpoints.length;
  }

  public getCheckpointPosition(index: number): Vector3 | null 
  {
    if (index >= 0 && index < this.checkpoints.length) 
    {
      return this.checkpoints[index].position.clone();
    }
    return null;
  }

  public getCheckpointNormal(index: number): Vector3 | null 
  {
    if (index >= 0 && index < this.checkpoints.length) 
    {
      return this.checkpoints[index].normal.clone();
    }
    return null;
  }

  public getCheckpointName(index: number): string | null 
  {
    if (index >= 0 && index < this.checkpoints.length) 
    {
      return this.checkpoints[index].name;
    }
    return null;
  }

  public isTrackLoaded(): boolean 
  {
    return this.isLoaded && this.track !== null;
  }

  public getStartingPositions(count: number = 1): Vector3[] 
  {
    const positions: Vector3[] = [];
    
    if (count <= 0) 
    {
      count = 1;
    }
    const fixedX = 50;
    const fixedY = 10;
    
    const availablePositions = [
      new Vector3(fixedX, fixedY, -20),
      new Vector3(fixedX, fixedY, -6.67),
      new Vector3(fixedX, fixedY, 6.67),
      new Vector3(fixedX, fixedY, 20)
    ];
    
    for (let i = 0; i < count; i++) 
    {
      const positionIndex = i % availablePositions.length;
      positions.push(availablePositions[positionIndex].clone());
    }
    
    return positions;
  }

  public getCheckpointMesh(index: number): AbstractMesh | null 
  {
    if (index >= 0 && index < this.checkpointMeshes.length) 
    {
      return this.checkpointMeshes[index];
    }
    return null;
  }

  public getGameCanvas(): GameCanvas 
  {
    return this.gameCanvas;
  }

  /**
   * Export checkpoints in backend-compatible format
   */
  public getCheckpointsForBackend(): Array<{
    id: number;
    name: string;
    position: { x: number; y: number; z: number };
    radius: number;
    isStartLine: boolean;
  }> 
  {
    return this.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      name: checkpoint.name,
      position: {
        x: checkpoint.position.x,
        y: checkpoint.position.y,
        z: checkpoint.position.z
      },
      radius: 30,
      isStartLine: checkpoint.name.toLowerCase() === 'start_line'
    }));
  }

  public dispose(): void 
  {
    if (this.track) 
    {
      this.track.dispose();
      this.track = null;
    }
    this.isLoaded = false;
  }
}