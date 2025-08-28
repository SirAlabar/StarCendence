import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { AssetManager } from '../../managers/AssetManager';
import { GameCanvas } from './GameCanvas';

export interface RacerSceneConfig 
{
  trackId: string;
  trackPath: string;
  trackFilename: string;
  enableFog?: boolean;
  fogColor?: Color3;
  fogDensity?: number;
}

const POLAR_PASS_CONFIG: RacerSceneConfig = {
  trackId: 'polar_pass',
  trackPath: '/assets/models/racing_tracks/',
  trackFilename: 'polar_pass.glb',
  enableFog: true,
  fogColor: new Color3(0.7, 0.8, 0.9),
  fogDensity: 0.002
};

export class RacerScene 
{
  private gameCanvas: GameCanvas;
  private scene: Scene;
  private assetManager: AssetManager;
  private config: RacerSceneConfig;
  private track: AbstractMesh | null = null;
  private isLoaded: boolean = false;

  public onTrackLoaded?: (track: AbstractMesh) => void;
  public onLoadingProgress?: (percentage: number, asset: string) => void;
  public onLoadingComplete?: () => void;
  public onLoadingError?: (errors: string[]) => void;

  constructor(gameCanvas: GameCanvas, config: RacerSceneConfig = POLAR_PASS_CONFIG) 
  {
    this.gameCanvas = gameCanvas;
    const scene = gameCanvas.getScene();
    if (!scene) 
    {
      throw new Error('Cannot create RacerScene: GameCanvas scene not initialized');
    }
    this.scene = scene;
    this.config = config;
    this.assetManager = new AssetManager(this.scene);
    
    console.log(`RacerScene initialized - Track: ${config.trackId}`);
  }

  public async loadTrack(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      console.warn('Track already loaded');
      return;
    }

    console.log(`Loading racing track: ${this.config.trackId}`);

    this.assetManager
      .addMeshAsset({
        id: this.config.trackId,
        type: 'mesh',
        path: this.config.trackPath,
        filename: this.config.trackFilename
      })
      .setCallbacks({
        onProgress: (progress) => {
          console.log(`Track loading: ${progress.percentage}% - ${progress.currentAsset}`);
          
          if (this.onLoadingProgress) {
            this.onLoadingProgress(progress.percentage, progress.currentAsset);
          }
        },
        onSuccess: () => {
          console.log('Track loaded successfully!');
          this.setupTrack();
          this.setupRacingEnvironment();
          
          if (this.onLoadingComplete) 
          {
            this.onLoadingComplete();
          }
        },
        onError: (errors) => {
          console.error('Failed to load track:', errors);
          
          if (this.onLoadingError) 
          {
            this.onLoadingError(errors);
          }
        }
      });

    await this.assetManager.load();
  }

  private setupTrack(): void 
  {
    this.track = this.assetManager.getFirstMesh(this.config.trackId);
    
    if (!this.track) 
    {
      console.error('Track mesh not found!');
      return;
    }

    this.track.position = Vector3.Zero();
    this.track.rotation = Vector3.Zero();
    this.track.scaling = new Vector3(8, 8, 8);

    console.log(`Track positioned: ${this.track.name}`);
    console.log(`Track bounds:`, this.track.getBoundingInfo());

    if (this.onTrackLoaded) 
    {
      this.onTrackLoaded(this.track);
    }

    this.isLoaded = true;
  }

  private setupRacingEnvironment(): void 
  {
    console.log('Setting up racing environment...');

    if (this.config.enableFog && this.config.fogColor) 
    {
      this.scene.fogMode = Scene.FOGMODE_EXP;
      this.scene.fogColor = this.config.fogColor;
      this.scene.fogDensity = this.config.fogDensity || 0.002;
      console.log('Racing fog configured for polar atmosphere');
    }

    if (this.config.fogColor) 
    {
      this.scene.clearColor = this.config.fogColor.toColor4();
    }

    console.log('Racing environment configured');
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
      return {
        min: Vector3.Zero(),
        max: Vector3.Zero(),
        size: Vector3.Zero()
      };
    }

    const boundingBox = this.track.getBoundingInfo().boundingBox;
    return {
      min: boundingBox.minimum,
      max: boundingBox.maximum,
      size: boundingBox.maximum.subtract(boundingBox.minimum)
    };
  }

  public isTrackLoaded(): boolean 
  {
    return this.isLoaded && this.track !== null;
  }

  public getStartingPositions(count: number = 1): Vector3[] 
  {
    if (!this.track) 
    {
      return [new Vector3(0, 2, 0)];
    }

    const trackCenter = this.getTrackCenter();
    const positions: Vector3[] = [];

    for (let i = 0; i < count; i++) 
    {
      positions.push(new Vector3(
        trackCenter.x + (i * 5),
        trackCenter.y + 3,
        trackCenter.z
      ));
    }

    return positions;
  }

  public getGameCanvas(): GameCanvas 
  {
    return this.gameCanvas;
  }

  public dispose(): void 
  {
    console.log('Disposing RacerScene...');
    
    if (this.assetManager) 
    {
      this.assetManager.dispose();
    }

    this.track = null;
    this.isLoaded = false;
  }

  public static async createPolarPass(gameCanvas: GameCanvas): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, POLAR_PASS_CONFIG);
    await racerScene.loadTrack();
    return racerScene;
  }
}