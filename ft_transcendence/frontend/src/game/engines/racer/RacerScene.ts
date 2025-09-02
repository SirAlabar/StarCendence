import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3,
  Mesh
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

export interface MaterialCollisionConfig 
{
  solidTrack: string[];
  fallZones: string[];
  specialSurfaces: string[];
}

export interface TrackMaterialData 
{
  mesh: Mesh;
  materialId: string;
  surfaceType: 'solid' | 'void' | 'boost' | 'ice' | 'start_finish';
  vertices: number[];
  indices: number[];
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
  private trackMaterialData: TrackMaterialData[] = [];
  
  private materialConfig: MaterialCollisionConfig = {
    solidTrack: ['track_surface', 'Ice', 'speed_boost', 'start_line', 'wall'],
    fallZones: ['void'],
    specialSurfaces: ['Ice', 'speed_boost', 'start_line']
  };

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
  }

  public async loadTrack(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }

    this.assetManager
      .addMeshAsset({
        id: this.config.trackId,
        type: 'mesh',
        path: this.config.trackPath,
        filename: this.config.trackFilename
      })
      .setCallbacks({
        onProgress: (progress) => 
        {
          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(progress.percentage, progress.currentAsset);
          }
        },
        onSuccess: () => 
        {
          this.setupTrack();
          this.setupRacingEnvironment();
          
          if (this.onLoadingComplete) 
          {
            this.onLoadingComplete();
          }
        },
        onError: (errors) => 
        {
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
      return;
    }

    this.track.position = Vector3.Zero();
    this.track.rotation = Vector3.Zero();
    this.track.scaling = new Vector3(8, 8, 8);

    this.extractTrackMaterialData();

    if (this.onTrackLoaded) 
    {
      this.onTrackLoaded(this.track);
    }

    this.isLoaded = true;
  }

  private extractTrackMaterialData(): void 
  {
    if (!this.track) 
    {
      return;
    }
    
    this.trackMaterialData = [];
    const childMeshes = this.track.getChildMeshes();
    
    console.log('=== TRACK MATERIAL EXTRACTION DEBUG ===');
    console.log(`Total child meshes found: ${childMeshes.length}`);
    
    childMeshes.forEach((child, index) => 
    {
      if (child instanceof Mesh) 
      {
        const babylonMesh = child as Mesh;
        const vertices = babylonMesh.getVerticesData('position');
        const indices = babylonMesh.getIndices();

        let materialId = 'unknown';
        if (babylonMesh.material) 
        {
          materialId = babylonMesh.material.name || babylonMesh.material.id || 'unknown';
        }

        const surfaceType = this.determineSurfaceType(materialId);
        
        console.log(`Mesh ${index + 1}:`);
        console.log(`  Name: ${babylonMesh.name}`);
        console.log(`  Material ID: ${materialId}`);
        console.log(`  Surface Type: ${surfaceType}`);
        console.log(`  Vertices: ${vertices ? vertices.length : 0}`);
        console.log(`  Indices: ${indices ? indices.length : 0}`);
        console.log(`  Has Collision: ${surfaceType !== 'void'}`);
        console.log('---');

        if (!vertices || !indices) 
        {
          console.warn(`  WARNING: Mesh ${babylonMesh.name} has no geometry data`);
          return;
        }
        
        this.trackMaterialData.push({
          mesh: babylonMesh,
          materialId,
          surfaceType,
          vertices: Array.from(vertices),
          indices: Array.from(indices)
        });
      }
      else 
      {
        console.log(`Child ${index + 1}: Not a mesh (${child.constructor.name})`);
      }
    });
    
    console.log('=== MATERIAL SUMMARY ===');
    const summary = this.trackMaterialData.reduce((acc, data) => 
    {
      acc[data.surfaceType] = (acc[data.surfaceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(summary).forEach(([type, count]) => 
    {
      console.log(`${type}: ${count} meshes`);
    });
    console.log('=== END DEBUG ===');
  }

 private determineSurfaceType(materialId: string, meshName?: string): 'solid' | 'void' | 'boost' | 'ice' | 'start_finish' 
  {
    const lowerMaterialId = materialId.toLowerCase();
    const lowerMeshName = meshName ? meshName.toLowerCase() : '';
    
    if (lowerMaterialId.startsWith('void') || lowerMaterialId.includes('invisible') ||
        lowerMeshName.startsWith('void')) 
    {
      return 'void';
    }
    
    if (lowerMaterialId.startsWith('speed_boost') || lowerMeshName.startsWith('speed_boost')) 
    {
      return 'boost';
    }
    
    if (lowerMaterialId.startsWith('ice') || lowerMeshName.startsWith('ice')) 
    {
      return 'ice';
    }
    
    if (lowerMaterialId.startsWith('start_line') || lowerMeshName.startsWith('start_line')) 
    {
      return 'start_finish';
    }
    
    return 'solid';
  }


  public shouldCreateCollisionForMaterial(materialId: string): boolean 
  {
    const surfaceType = this.determineSurfaceType(materialId);
    return surfaceType !== 'void';
  }

  public getCollisionMeshes(): TrackMaterialData[] 
  {
    return this.trackMaterialData.filter(data => 
      this.shouldCreateCollisionForMaterial(data.materialId)
    );
  }

  public getFallZoneMeshes(): TrackMaterialData[] 
  {
    return this.trackMaterialData.filter(data => 
      data.surfaceType === 'void'
    );
  }

  public getSpecialSurfaceMeshes(): TrackMaterialData[] 
  {
    return this.trackMaterialData.filter(data => 
      ['boost', 'ice', 'start_finish'].includes(data.surfaceType)
    );
  }

  public getStartLinePosition(): Vector3 | null 
  {
    const startLineMesh = this.trackMaterialData.find(data => 
      data.surfaceType === 'start_finish'
    );
    
    if (startLineMesh) 
    {
      return startLineMesh.mesh.getBoundingInfo().boundingBox.center;
    }
    
    return null;
  }

  public getMaterialCollisionConfig(): MaterialCollisionConfig 
  {
    return this.materialConfig;
  }

  public setMaterialCollisionConfig(config: Partial<MaterialCollisionConfig>): void 
  {
    this.materialConfig = { ...this.materialConfig, ...config };
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
    const startLinePos = this.getStartLinePosition();
    
    if (startLinePos) 
    {
      const positions: Vector3[] = [];
      for (let i = 0; i < count; i++) 
      {
        positions.push(new Vector3(
          startLinePos.x + (i * 5),
          startLinePos.y + 2,
          startLinePos.z
        ));
      }
      return positions;
    }
    
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
    if (this.assetManager) 
    {
      this.assetManager.dispose();
    }

    this.track = null;
    this.trackMaterialData = [];
    this.isLoaded = false;
  }

  public static async createPolarPass(gameCanvas: GameCanvas): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, POLAR_PASS_CONFIG);
    await racerScene.loadTrack();
    return racerScene;
  }
}