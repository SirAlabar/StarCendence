import { 
  Scene,
  AbstractMesh,
  Vector3,
  Color3,
  Mesh,
  CreateGround,
  CreateBox,
  StandardMaterial,
  SceneLoader,
  VertexBuffer
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { GameCanvas } from './GameCanvas';

export interface RacerSceneConfig 
{
  trackId: string;
  trackPath: string;
  trackFilename: string;
  trackSize?: number;
  trackSubdivisions?: number;
  wallHeight?: number;
  wallThickness?: number;
  enableFog?: boolean;
  fogColor?: Color3;
  fogDensity?: number;
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
  fogDensity: 0.002,
  trackSize: 5000,
  trackSubdivisions: 50,
  wallHeight: 20,        
  wallThickness: 5, 
};


export class RacerScene 
{
  private gameCanvas: GameCanvas;
  private scene: Scene;
  private config: RacerSceneConfig;
  private track: AbstractMesh | null = null;
  private walls: AbstractMesh[] = []; 
  private isLoaded: boolean = false;
  private realVertexBounds: { min: Vector3; max: Vector3; size: Vector3 } | null = null;
  private trackMaterialData: TrackMaterialData[] = [];

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
    this.config = { ...POLAR_PASS_CONFIG, ...config };
  }

  public async loadTrack(): Promise<void> 
  {
    if (this.isLoaded) 
    {
      return;
    }

    try 
    {
      console.log('RacerScene: Loading track model...');
      
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(10, `Loading ${this.config.trackFilename}...`);
      }

      await this.loadGLBTrack();
      this.setupRacingEnvironment();
      
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(100, 'Track ready');
      }

      if (this.onLoadingComplete) 
      {
        this.onLoadingComplete();
      }

      console.log('RacerScene: Track loaded successfully');
    } 
    catch (error) 
    {
      console.error('RacerScene: Failed to load track:', error);
      if (this.onLoadingError) 
      {
        this.onLoadingError([`Failed to load track: ${error}`]);
      }
    }
  }

private async loadGLBTrack(): Promise<void> 
{
  return new Promise((resolve, reject) => 
  {
    console.log(`Loading ${this.config.trackFilename} model...`);
    
    if (this.onLoadingProgress) 
    {
      this.onLoadingProgress(30, `Downloading ${this.config.trackFilename}...`);
    }

    SceneLoader.ImportMesh(
      "",  // Load all meshes
      this.config.trackPath, 
      this.config.trackFilename, 
      this.scene, 
      (newMeshes) => 
      {
        try 
        {
          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(70, 'Processing track geometry...');
          }

          console.log("=== TRACK MESH ANALYSIS ===");
          console.log(`Total meshes loaded: ${newMeshes.length}`);
          
          // Find ALL meshes with geometry - NO main mesh concept
          let meshesWithGeometry: Mesh[] = [];

          for (const mesh of newMeshes) {
            // console.log(`Checking mesh: ${mesh.name}`);
            if (mesh instanceof Mesh) {
              const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
              const indices = mesh.getIndices();
              // console.log(`  Vertices: ${positions ? positions.length / 3 : 0}`);
              // console.log(`  Triangles: ${indices ? indices.length / 3 : 0}`);
              
              if (positions && indices && positions.length > 0 && indices.length > 0) {
                // console.log(`  ✅ Mesh with geometry: ${mesh.name}`);
                meshesWithGeometry.push(mesh);
              }
            }
          }

          if (meshesWithGeometry.length === 0) {
            throw new Error(`No meshes with geometry found in ${this.config.trackFilename}`);
          }

          console.log(`Found ${meshesWithGeometry.length} meshes with geometry - ALL will be used for collision`);
          
          // Position and scale adjustment for ALL meshes
          console.log("=== TRACK POSITIONING & SCALING FOR ALL MESHES ===");
          meshesWithGeometry.forEach((mesh, index) => {
            // console.log(`Adjusting mesh ${index + 1}: ${mesh.name}`);
            // console.log(`  Position BEFORE: x=${mesh.position.x}, y=${mesh.position.y}, z=${mesh.position.z}`);
            // console.log(`  Scaling BEFORE: x=${mesh.scaling.x}, y=${mesh.scaling.y}, z=${mesh.scaling.z}`);
            
            mesh.position = Vector3.Zero();
            mesh.rotation = Vector3.Zero();
            mesh.scaling = new Vector3(8, 8, 8);
            
            // console.log(`  Position AFTER: x=${mesh.position.x}, y=${mesh.position.y}, z=${mesh.position.z}`);
            // console.log(`  Scaling AFTER: x=${mesh.scaling.x}, y=${mesh.scaling.y}, z=${mesh.scaling.z}`);
          });

          // Extract material data from ALL meshes with geometry
          this.extractAllMeshData(meshesWithGeometry);

          // Verify we have track data
          if (this.trackMaterialData.length === 0) {
            console.warn('No material data extracted, but continuing...');
          }

          // // NO single track - ALL meshes are the track
          // this.track = null;

          // For callback compatibility, use first visible mesh or first mesh
          const callbackMesh = meshesWithGeometry.find(m => !m.name.toLowerCase().includes('void')) || meshesWithGeometry[0];
          if (this.onTrackLoaded && callbackMesh) 
          {
            this.onTrackLoaded(callbackMesh);
          }

          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(90, 'Track loaded successfully');
          }

          this.isLoaded = true;
          resolve();
        }
        catch (error) 
        {
          console.error('Error processing track mesh:', error);
          reject(error);
        }
      },
      (progress) => 
      {
        if (progress.total > 0) 
        {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Track download progress: ${percentage}%`);
          
          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(30 + (percentage * 0.4), `Downloading: ${percentage}%`);
          }
        }
      },
      (scene, message) => 
      {
        console.error('Track loading error:', message);
        reject(new Error(`Failed to load track: ${message}`));
      }
    );
  });
}

private extractAllMeshData(meshesWithGeometry: Mesh[]): void 
{
  this.trackMaterialData = [];
  
  console.log('=== MATERIAL ANALYSIS FOR ALL MESHES ===');
  console.log(`Processing ${meshesWithGeometry.length} meshes with geometry`);
  
  meshesWithGeometry.forEach((babylonMesh, index) => 
  {
    const vertices = babylonMesh.getVerticesData(VertexBuffer.PositionKind);
    const indices = babylonMesh.getIndices();

    let materialId = 'track_surface';
    if (babylonMesh.material) 
    {
      materialId = babylonMesh.material.name || babylonMesh.material.id || 'track_surface';
    }

    const surfaceType = this.determineSurfaceType(materialId, babylonMesh.name);
    
    // console.log(`Mesh ${index + 1}: ${babylonMesh.name}`);
    // console.log(`  Material: ${materialId}`);
    // console.log(`  Surface: ${surfaceType}`);
    // console.log(`  Vertices: ${vertices ? vertices.length / 3 : 0}`);
    // console.log(`  Triangles: ${indices ? indices.length / 3 : 0}`);

    if (vertices && indices) 
    {
      this.trackMaterialData.push({
        mesh: babylonMesh,
        materialId,
        surfaceType,
        vertices: Array.from(vertices),
        indices: Array.from(indices)
      });
    }
  });
  
  console.log(`Total collision meshes stored: ${this.trackMaterialData.length}`);
  
  // Summary by surface type
  const summary = this.trackMaterialData.reduce((acc, data) => 
  {
    acc[data.surfaceType] = (acc[data.surfaceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(summary).forEach(([type, count]) => 
  {
    console.log(`${type}: ${count} meshes`);
  });
}

// NO MORE "main track" concept - use these methods instead:

// Get all solid collision meshes (track + walls, no void zones)
public getAllSolidMeshes(): Mesh[] 
{
  return this.trackMaterialData
    .filter(data => data.surfaceType !== 'void')
    .map(data => data.mesh);
}

// Get meshes by surface type
public getMeshesByType(surfaceType: 'solid' | 'void' | 'boost' | 'ice' | 'start_finish'): Mesh[] 
{
  return this.trackMaterialData
    .filter(data => data.surfaceType === surfaceType)
    .map(data => data.mesh);
}

// Get ALL meshes for physics (you should create physics bodies for each)
public getAllPhysicsMeshes(): { mesh: Mesh, surfaceType: string }[] 
{
  return this.trackMaterialData.map(data => ({
    mesh: data.mesh,
    surfaceType: data.surfaceType
  }));
}

public getCollisionMeshes(): TrackMaterialData[] 
{
  return this.trackMaterialData.filter(data => data.surfaceType !== 'void');
}

// DEPRECATED - DO NOT USE - Use getAllPhysicsMeshes() instead
public getMainTrackForPhysics(): AbstractMesh | null 
{
  console.warn('getMainTrackForPhysics() is deprecated - use getAllPhysicsMeshes() instead');
  return null;
}

private determineSurfaceType(materialId: string, meshName?: string): 'solid' | 'void' | 'boost' | 'ice' | 'start_finish' 
{
  const lowerMaterialId = materialId.toLowerCase();
  const lowerMeshName = meshName ? meshName.toLowerCase() : '';
  
  if (lowerMaterialId.includes('void') || lowerMaterialId.includes('fall') ||
      lowerMeshName.includes('void') || lowerMeshName.includes('fall')) 
  {
    return 'void';
  }
  
  if (lowerMaterialId.includes('boost') || lowerMaterialId.includes('speed') ||
      lowerMeshName.includes('boost') || lowerMeshName.includes('speed')) 
  {
    return 'boost';
  }
  
  if (lowerMaterialId.includes('ice') || lowerMeshName.includes('ice')) 
  {
    return 'ice';
  }
  
  if (lowerMaterialId.includes('start') || lowerMaterialId.includes('finish') ||
      lowerMeshName.includes('start') || lowerMeshName.includes('finish')) 
  {
    return 'start_finish';
  }
  
  return 'solid';
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

    console.log('Racing environment setup complete');
  }

  public getTrack(): AbstractMesh | null 
  {
    return this.track;
  }

  public getAllGeometry(): AbstractMesh[] 
  {
    const allGeometry: AbstractMesh[] = [];
    // Return all meshes since we don't have a single track
    this.trackMaterialData.forEach(data => {
      allGeometry.push(data.mesh);
    });
    return allGeometry;
  }

  public getTrackCenter(): Vector3 
  {
    if (this.trackMaterialData.length === 0) 
    {
      return Vector3.Zero();
    }
    
    // Calculate center from all solid meshes
    const solidMeshes = this.getAllSolidMeshes();
    if (solidMeshes.length === 0) {
      return Vector3.Zero();
    }
    
    let center = Vector3.Zero();
    solidMeshes.forEach(mesh => {
      center = center.add(mesh.getBoundingInfo().boundingBox.center);
    });
    
    return center.scale(1 / solidMeshes.length);
  }

  public getTrackBounds(): { min: Vector3; max: Vector3; size: Vector3 } 
  {
    if (this.trackMaterialData.length === 0) 
    {
      const defaultSize = this.config.trackSize! / 2;
      return {
        min: new Vector3(-defaultSize, -50, -defaultSize),
        max: new Vector3(defaultSize, 50, defaultSize),
        size: new Vector3(this.config.trackSize!, 100, this.config.trackSize!)
      };
    }

    // Calculate bounds from all solid meshes
    const solidMeshes = this.getAllSolidMeshes();
    if (solidMeshes.length === 0) {
      return {
        min: Vector3.Zero(),
        max: Vector3.Zero(),
        size: Vector3.Zero()
      };
    }
    
    let minBounds = solidMeshes[0].getBoundingInfo().boundingBox.minimum.clone();
    let maxBounds = solidMeshes[0].getBoundingInfo().boundingBox.maximum.clone();
    
    solidMeshes.forEach(mesh => {
      const bounds = mesh.getBoundingInfo().boundingBox;
      minBounds = Vector3.Minimize(minBounds, bounds.minimum);
      maxBounds = Vector3.Maximize(maxBounds, bounds.maximum);
    });
    
    return {
      min: minBounds,
      max: maxBounds,
      size: maxBounds.subtract(minBounds)
    };
  }

  public isTrackLoaded(): boolean 
  {
    return this.isLoaded && this.trackMaterialData.length > 0;
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

  public getStartingPositions(count: number = 1): Vector3[] 
  {
    const startLinePos = this.getStartLinePosition();
    
    if (startLinePos) 
    {
      
      console.log("=== START LINE POSITION ===");
      console.log(`x=${startLinePos.x}, y=${startLinePos.y}, z=${startLinePos.z}`);
      const positions: Vector3[] = [];
      for (let i = 0; i < count; i++) 
      {
        positions.push(new Vector3(
          startLinePos.x + (i * 5),
          startLinePos.y + 12,
          startLinePos.z
        ));
      }
      console.log("=== STARTING POSITIONS ===");
      positions.forEach((pos, idx) =>
      {
        console.log(`Position ${idx}: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
      });
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
    this.trackMaterialData.forEach(data => {
      data.mesh.dispose();
    });
    this.trackMaterialData = [];
    
    this.walls.forEach(wall => {
      wall.dispose();
    });
    this.walls = [];
    
    this.track = null;
    this.isLoaded = false;
    console.log('RacerScene: Disposed');
  }

  public static async createCanyonTrack(gameCanvas: GameCanvas, config?: RacerSceneConfig): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, config);
    await racerScene.loadTrack();
    return racerScene;
  }
}