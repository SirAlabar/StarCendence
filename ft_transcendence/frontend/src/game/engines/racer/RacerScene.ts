import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3,
  Mesh,
  SceneLoader,
  VertexBuffer
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
        this.onLoadingProgress(10, 'Loading canyon.babylon...');
      }

      await this.loadCanyonTrack();
      this.setupRacingEnvironment();
      
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(100, 'Canyon track ready');
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
        this.onLoadingError([`Failed to load canyon track: ${error}`]);
      }
    }
  }

  public findCollisionMesh(): AbstractMesh | null 
  {
    return (this as any).collisionMesh || null;
  }

  private async loadCanyonTrack(): Promise<void> 
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
        (scene, message) => 
        {
          reject(new Error(`Failed to load polar pass: ${message}`));
        }
      );
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

  public isTrackLoaded(): boolean 
  {
    return this.isLoaded && this.track !== null;
  }

  public getStartingPositions(count: number = 1): Vector3[] 
  {
    return [new Vector3(109, -192, 627)];
  }

  public getGameCanvas(): GameCanvas 
  {
    return this.gameCanvas;
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

  public static async createCanyonTrack(gameCanvas: GameCanvas, config?: RacerSceneConfig): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, config);
    await racerScene.loadTrack();
    return racerScene;
  }
}