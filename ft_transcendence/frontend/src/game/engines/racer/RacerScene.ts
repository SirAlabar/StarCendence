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

const DEFAULT_CONFIG: RacerSceneConfig = {
  trackSize: 5000,        // Mantido para compatibilidade
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
  private walls: AbstractMesh[] = []; 
  private isLoaded: boolean = false;
  private realVertexBounds: { min: Vector3; max: Vector3; size: Vector3 } | null = null;

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
      console.log('RacerScene: Loading canyon track model...');
      
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

      console.log('RacerScene: Canyon track loaded successfully');
    } 
    catch (error) 
    {
      console.error('RacerScene: Failed to load canyon track:', error);
      if (this.onLoadingError) 
      {
        this.onLoadingError([`Failed to load canyon track: ${error}`]);
      }
    }
  }

private async loadCanyonTrack(): Promise<void> 
{
  return new Promise((resolve, reject) => 
  {
    console.log('Loading canyon.babylon model...');
    
    if (this.onLoadingProgress) 
    {
      this.onLoadingProgress(30, 'Downloading canyon model...');
    }

    // Carregar EXATAMENTE como o exemplo
    SceneLoader.ImportMesh(
      "Loft001",  // IMPORTANTE: Nome exato da mesh
      "https://raw.githubusercontent.com/RaggarDK/Baby/baby/", 
      "canyon.babylon", 
      this.scene, 
      (newMeshes) => 
      {
        try 
        {
          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(70, 'Processing canyon geometry...');
          }

          // EXATO do exemplo - pegar apenas a primeira mesh
          const mesh = newMeshes[0];
          if (!mesh) 
          {
            throw new Error('No mesh found in canyon.babylon');
          }

          console.log("=== CANYON MESH ANALYSIS ===");
          console.log(`Total meshes loaded: ${newMeshes.length}`);
          console.log(`Main mesh: ${mesh.name}`);
          console.log(`Children count: ${mesh.getChildMeshes().length}`);
          
          // AJUSTAR POSIÇÃO EXATAMENTE COMO O EXEMPLO
          console.log("=== CANYON POSITIONING ===");
          console.log("Canyon mesh position BEFORE adjustment:", mesh.position);
          mesh.position.y -= 2.5; // APENAS o ajuste Y, mantendo X e Z originais
          console.log("Canyon mesh position AFTER adjustment:", mesh.position);
          console.log("Canyon mesh world matrix:", mesh.getWorldMatrix());

          // Verificar dados geométricos
          if (mesh instanceof Mesh) 
          {
            const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
            const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
            const colors = mesh.getVerticesData(VertexBuffer.ColorKind);
            const uvs = mesh.getVerticesData(VertexBuffer.UVKind);
            const indices = mesh.getIndices();
            
            console.log(`Vertices: ${positions ? positions.length / 3 : 'null'}`);
            console.log(`Triangles: ${indices ? indices.length / 3 : 'null'}`);
            console.log(`First triangle indices:`, indices ? [indices[0], indices[1], indices[2]] : 'none');

            if (!positions || !indices || positions.length === 0 || indices.length === 0) 
            {
              throw new Error('Canyon mesh has no geometry data');
            }
          }

          // Definir como track principal
          this.track = mesh;

          if (this.onTrackLoaded) 
          {
            this.onTrackLoaded(this.track);
          }

          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(90, 'Canyon loaded successfully');
          }

          this.isLoaded = true;
          resolve();
        }
        catch (error) 
        {
          console.error('Error processing canyon mesh:', error);
          reject(error);
        }
      },
      (progress) => 
      {
        if (progress.total > 0) 
        {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Canyon download progress: ${percentage}%`);
          
          if (this.onLoadingProgress) 
          {
            this.onLoadingProgress(30 + (percentage * 0.4), `Downloading: ${percentage}%`);
          }
        }
      },
      (scene, message) => 
      {
        console.error('Canyon loading error:', message);
        reject(new Error(`Failed to load canyon: ${message}`));
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

    console.log('Racing environment setup complete for canyon');
  }

  public getTrack(): AbstractMesh | null 
  {
    return this.track;
  }

  public getAllGeometry(): AbstractMesh[] 
  {
    const allGeometry: AbstractMesh[] = [];
    if (this.track) {
      allGeometry.push(this.track);
    }
    // Nota: Canyon não tem paredes separadas como o ground simples
    return allGeometry;
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
      // Fallback para valores padrão
      const defaultSize = this.config.trackSize! / 2;
      return {
        min: new Vector3(-defaultSize, -50, -defaultSize),
        max: new Vector3(defaultSize, 50, defaultSize),
        size: new Vector3(this.config.trackSize!, 100, this.config.trackSize!)
      };
    }

    // Bounds reais do canyon
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
    
    // Limpar paredes (se houver)
    this.walls.forEach(wall => {
      wall.dispose();
    });
    this.walls = [];
    
    this.isLoaded = false;
    console.log('RacerScene: Disposed (canyon track)');
  }

  public static async createCanyonTrack(gameCanvas: GameCanvas, config?: RacerSceneConfig): Promise<RacerScene> 
  {
    const racerScene = new RacerScene(gameCanvas, config);
    await racerScene.loadTrack();
    return racerScene;
  }
}