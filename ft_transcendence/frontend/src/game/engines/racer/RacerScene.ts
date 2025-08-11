// Racing Scene Manager - Loads and manages racing environment

import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { AssetManager } from '../../managers/AssetManager';
import { GameCanvas } from '../../../components/game/GameCanvas';

export interface RacerSceneConfig 
{
  trackId: string;
  trackPath: string;
  trackFilename: string;
  enableFog?: boolean;
  fogColor?: Color3;
  fogDensity?: number;
}

// Default configuration for Polar Pass
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

  // Loading callbacks
  public onTrackLoaded?: (track: AbstractMesh) => void;
  public onLoadingProgress?: (percentage: number, asset: string) => void;
  public onLoadingComplete?: () => void;
  public onLoadingError?: (errors: string[]) => void;

  constructor(gameCanvas: GameCanvas, config: RacerSceneConfig = POLAR_PASS_CONFIG) 
  {
    this.gameCanvas = gameCanvas;
    this.scene = gameCanvas.getScene();
    this.config = config;
    this.assetManager = new AssetManager(this.scene);
    
    console.log(`RacerScene initialized - Track: ${config.trackId}`);
  }

  // Load the racing track and set up environment
  public async loadTrack(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      console.warn('Track already loaded');
      return;
    }

    console.log(`Loading racing track: ${this.config.trackId}`);

    // Show loading state on GameCanvas
    this.gameCanvas.setLoadingState(true, `Loading ${this.config.trackId}...`);

    // Configure asset loading
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
          this.gameCanvas.setLoadingState(true, `Loading track: ${progress.percentage}%`);
          
          if (this.onLoadingProgress) {
            this.onLoadingProgress(progress.percentage, progress.currentAsset);
          }
        },
        onSuccess: () => {
          console.log('✅ Track loaded successfully!');
          this.setupTrack();
          this.setupRacingEnvironment();
          this.positionCameraForRacing();
          
          // Hide loading state
          this.gameCanvas.setLoadingState(false);
          
          if (this.onLoadingComplete) 
          {
            this.onLoadingComplete();
          }
        },
        onError: (errors) => {
          console.error('❌ Failed to load track:', errors);
          this.gameCanvas.setLoadingState(false);
          
          if (this.onLoadingError) 
          {
            this.onLoadingError(errors);
          }
        }
      });

    // Start loading
    await this.assetManager.load();
  }

  // Set up the track mesh
  private setupTrack(): void 
  {
    this.track = this.assetManager.getFirstMesh(this.config.trackId);
    
    if (!this.track) 
    {
      console.error('Track mesh not found!');
      return;
    }

    // Position track at origin
    this.track.position = Vector3.Zero();
    this.track.rotation = Vector3.Zero();
    
    this.track.scaling = new Vector3(6, 6, 6);

    console.log(`Track positioned: ${this.track.name}`);
    console.log(`Track bounds:`, this.track.getBoundingInfo());

    // Call callback if set
    if (this.onTrackLoaded) 
    {
      this.onTrackLoaded(this.track);
    }

    this.isLoaded = true;
  }

  // Set up racing-specific environment
  private setupRacingEnvironment(): void 
  {
    console.log('Setting up racing environment...');

    // Set up polar racing atmosphere
    if (this.config.enableFog && this.config.fogColor) 
    {
      this.scene.fogMode = Scene.FOGMODE_EXP;
      this.scene.fogColor = this.config.fogColor;
      this.scene.fogDensity = this.config.fogDensity || 0.002;
      console.log('✅ Racing fog configured for polar atmosphere');
    }

    // Set scene clear color for polar environment
    if (this.config.fogColor) 
    {
      this.scene.clearColor = this.config.fogColor.toColor4();
    }

    // GameCanvas already handles basic lighting, we just enhance for racing
    console.log('✅ Racing environment configured (using GameCanvas foundation)');
  }

  // Position camera for racing (uses GameCanvas camera system)
  private positionCameraForRacing(): void 
  {
    if (!this.track) return;

    // Get track bounds to position camera appropriately
    const boundingInfo = this.track.getBoundingInfo();
    const trackCenter = boundingInfo.boundingBox.center;
    const trackSize = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);

    console.log('Track center:', trackCenter);
    console.log('Track size:', trackSize);

    // Use GameCanvas camera reconfiguration for racing view
    const cameraDistance = Math.max(trackSize.x, trackSize.z) * 0.8;
    
    this.gameCanvas.reconfigureCamera({
      type: 'arcRotate',
      target: trackCenter,
      radius: cameraDistance,
      alpha: -Math.PI / 2,
      beta: Math.PI / 4
    });

    console.log('✅ Camera positioned for racing (using GameCanvas camera system)');
  }

  // Get track information
  public getTrack(): AbstractMesh | null 
  {
    return this.track;
  }

  public getTrackCenter(): Vector3 
  {
    if (!this.track) return Vector3.Zero();
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

  // Check if track is loaded
  public isTrackLoaded(): boolean 
  {
    return this.isLoaded && this.track !== null;
  }

  // Get starting positions for pods
  public getStartingPositions(count: number = 1): Vector3[] 
  {
    if (!this.track) return [Vector3.Zero()];

    const trackCenter = this.getTrackCenter();
    const positions: Vector3[] = [];

    // Generate starting positions
    for (let i = 0; i < count; i++) 
    {
      positions.push(new Vector3(
        trackCenter.x + (i * 5), // Spread pods apart
        trackCenter.y + 2,       // Above track surface
        trackCenter.z
      ));
    }

    return positions;
  }

  // Get the GameCanvas instance
  public getGameCanvas(): GameCanvas 
  {
    return this.gameCanvas;
  }

  // Dispose resources
  public dispose(): void 
  {
    this.track = null;
    this.isLoaded = false;
  }

  // Static factory method for easy setup with GameCanvas
  public static async createPolarPass(gameCanvas: GameCanvas): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, POLAR_PASS_CONFIG);
    await racerScene.loadTrack();
    return racerScene;
  }
}