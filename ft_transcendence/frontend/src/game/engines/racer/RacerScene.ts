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

  public findCollisionMesh(): AbstractMesh | null 
  {
    // Retornar o collision mesh que foi armazenado
    return (this as any).collisionMesh || null;
  }

  private async loadCanyonTrack(): Promise<void> 
  {
    return new Promise((resolve, reject) => 
    {
      console.log('Loading polar_pass.glb model...');
      
      if (this.onLoadingProgress) 
      {
        this.onLoadingProgress(30, 'Downloading polar pass model...');
      }

      // Importar TODOS os meshes do GLB
      SceneLoader.ImportMesh(
        "", // String vazia para importar TUDO
        "/assets/models/racing_tracks/", 
        "polar_pass.glb", 
        this.scene, 
        (newMeshes) => 
        {
          try 
          {
            console.log("=== SYNCHRONIZING VISUAL AND COLLISION MESHES ===");
            console.log(`Total meshes loaded: ${newMeshes.length}`);
            
            // 1. USAR __root__ para RENDERIZAÇÃO (visual com texturas)
            const visualMesh = newMeshes[0]; // __root__ com todos os child meshes
            
            // 2. ENCONTRAR mesh "collision" para FÍSICA
            let collisionMesh = null;
            for (let i = 0; i < newMeshes.length; i++) {
              console.log(`Mesh ${i}: ${newMeshes[i].name}`);
              if (newMeshes[i].name.toLowerCase() === 'collision') {
                collisionMesh = newMeshes[i];
                console.log(`✅ Found collision mesh at index ${i}`);
                break;
              }
            }

            if (!collisionMesh) {
              throw new Error('Collision mesh not found in GLB');
            }

            console.log("=== APPLYING IDENTICAL TRANSFORMS ===");
            
            // 3. DEFINIR TRANSFORMAÇÕES ÚNICAS
            const scale = new Vector3(8, 8, 8);
            const position = new Vector3(0, -2.5, 0);
            const rotation = Vector3.Zero();
            
            // 4. APLICAR EXATAMENTE AS MESMAS TRANSFORMAÇÕES EM AMBOS
            
            // Visual mesh (para renderização)
            visualMesh.position = position.clone();
            visualMesh.rotation = rotation.clone();
            visualMesh.scaling = scale.clone();
            
            // Collision mesh (para física) - APLICAR AS MESMAS TRANSFORMAÇÕES
            collisionMesh.position = position.clone();
            collisionMesh.rotation = rotation.clone();
            collisionMesh.scaling = scale.clone(); // CRÍTICO: mesma escala!
            
            console.log(`Visual mesh - Pos: ${visualMesh.position}, Scale: ${visualMesh.scaling}`);
            console.log(`Collision mesh - Pos: ${collisionMesh.position}, Scale: ${collisionMesh.scaling}`);

            // 5. TORNAR COLLISION INVISÍVEL (só para física)
            collisionMesh.visibility = 0;
            collisionMesh.isVisible = false;
            console.log("Collision mesh hidden (physics only)");

            // 6. VERIFICAR GEOMETRIA DO COLLISION
            if (collisionMesh instanceof Mesh) 
            {
              const positions = collisionMesh.getVerticesData(VertexBuffer.PositionKind);
              const indices = collisionMesh.getIndices();
              
              console.log(`Collision vertices: ${positions ? positions.length / 3 : 'null'}`);
              console.log(`Collision triangles: ${indices ? indices.length / 3 : 'null'}`);

              if (!positions || !indices || positions.length === 0 || indices.length === 0) 
              {
                throw new Error('Collision mesh has no geometry data');
              }
            }

            // 7. USAR VISUAL MESH como track principal
            this.track = visualMesh; // Para renderização
            
            // 8. ARMAZENAR REFERÊNCIA DO COLLISION
            (this as any).collisionMesh = collisionMesh; // Para física

            console.log("=== MESHES PERFECTLY SYNCHRONIZED ===");
            console.log(`Visual: ${visualMesh.name} - visible, with textures`);
            console.log(`Collision: ${collisionMesh.name} - hidden, same transforms`);

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
            console.error('Error processing meshes:', error);
            reject(error);
          }
        },
        (progress) => 
        {
          if (progress.total > 0) 
          {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Polar pass download progress: ${percentage}%`);
            
            if (this.onLoadingProgress) 
            {
              this.onLoadingProgress(30 + (percentage * 0.4), `Downloading: ${percentage}%`);
            }
          }
        },
        (scene, message) => 
        {
          console.error('Polar pass loading error:', message);
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