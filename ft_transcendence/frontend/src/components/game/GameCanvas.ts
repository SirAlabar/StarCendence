// frontend/src/components/game/GameCanvas.ts
// Generic 3D Rendering Component - Reusable for all games

import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  FreeCamera,
  UniversalCamera,
  HemisphericLight, 
  DirectionalLight,
  Vector3, 
  Color3,
  Camera
} from '@babylonjs/core';

// Configuration interfaces
export interface CameraConfig 
{
  type: 'arcRotate' | 'free' | 'universal';
  position?: Vector3;
  target?: Vector3;
  radius?: number; // For ArcRotate camera
  alpha?: number;  // For ArcRotate camera  
  beta?: number;   // For ArcRotate camera
}

export interface GameCanvasConfig 
{
  // Camera configuration
  camera?: CameraConfig;
  
  // Lighting configuration
  lighting?: {
    ambient?: {
      intensity?: number;
      color?: Color3;
      direction?: Vector3;
    };
    directional?: {
      intensity?: number;
      color?: Color3;
      direction?: Vector3;
    };
  };
  
  // Engine configuration
  engine?: {
    antialias?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    preserveDrawingBuffer?: boolean;
  };
  
  // Performance configuration
  performance?: {
    skipPointerPicking?: boolean;
    hardwareScaling?: number;
    targetFPS?: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: GameCanvasConfig = {
  camera: {
    type: 'arcRotate',
    position: new Vector3(0, 5, -10),
    target: Vector3.Zero(),
    radius: 10,
    alpha: -Math.PI / 2,
    beta: Math.PI / 3
  },
  lighting: {
    ambient: {
      intensity: 0.4,
      color: new Color3(1, 1, 1),
      direction: new Vector3(0, 1, 0)
    },
    directional: {
      intensity: 0.6,
      color: new Color3(1, 0.95, 0.8),
      direction: new Vector3(-1, -1, -1)
    }
  },
  engine: {
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  },
  performance: {
    skipPointerPicking: true,
    hardwareScaling: 1.0,
    targetFPS: 60
  }
};

export class GameCanvas 
{
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: Camera;
  private isDisposed: boolean = false;
  private config: GameCanvasConfig;
  private renderLoop: number | null = null;

  constructor(canvasId: string, config: Partial<GameCanvasConfig> = {}) 
  {
    // Merge config with defaults
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    
    // Get canvas element
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) 
    {
      throw new Error(`Canvas with id '${canvasId}' not found`);
    }
    this.canvas = canvasElement as HTMLCanvasElement;

    // Initialize Babylon.js engine
    this.engine = this.createEngine();
    this.scene = new Scene(this.engine);
    
    // Setup scene components
    this.setupPerformanceOptimizations();
    this.camera = this.setupCamera();
    this.setupLighting();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('GameCanvas initialized - ready for game integration');
  }

  private mergeConfig(defaultConfig: GameCanvasConfig, userConfig: Partial<GameCanvasConfig>): GameCanvasConfig 
  {
    return {
      camera: { 
        ...defaultConfig.camera!, 
        ...userConfig.camera
      },
      lighting: {
        ambient: { ...defaultConfig.lighting?.ambient, ...userConfig.lighting?.ambient },
        directional: { ...defaultConfig.lighting?.directional, ...userConfig.lighting?.directional }
      },
      engine: { ...defaultConfig.engine, ...userConfig.engine },
      performance: { ...defaultConfig.performance, ...userConfig.performance }
    };
  }

  private createEngine(): Engine 
  {
    const engineConfig = this.config.engine!;
    
    return new Engine(this.canvas, engineConfig.antialias, {
      preserveDrawingBuffer: engineConfig.preserveDrawingBuffer,
      stencil: true,
      antialias: engineConfig.antialias,
      powerPreference: engineConfig.powerPreference,
      doNotHandleContextLost: true
    });
  }

  private setupPerformanceOptimizations(): void 
  {
    const perfConfig = this.config.performance!;
    
    // Scene optimizations
    if (perfConfig.skipPointerPicking) 
    {
      this.scene.skipPointerMovePicking = true;
      this.scene.skipPointerDownPicking = true;
      this.scene.skipPointerUpPicking = true;
    }
    
    // Hardware scaling
    if (perfConfig.hardwareScaling) 
    {
      this.engine.setHardwareScalingLevel(perfConfig.hardwareScaling);
    }
    
    // Audio optimization
    if (this.scene.audioEnabled) 
    {
      this.scene.headphone = true;
    }
  }

  private setupCamera(): Camera 
  {
    const camConfig = this.config.camera!;
    let camera: Camera;

    switch (camConfig.type) 
    {
      case 'free':
        camera = new FreeCamera('freeCamera', camConfig.position || Vector3.Zero(), this.scene);
        if (camConfig.target) 
        {
          (camera as FreeCamera).setTarget(camConfig.target);
        }
        break;
        
      case 'universal':
        camera = new UniversalCamera('universalCamera', camConfig.position || Vector3.Zero(), this.scene);
        if (camConfig.target) 
        {
          (camera as UniversalCamera).setTarget(camConfig.target);
        }
        break;
        
      case 'arcRotate':
      default:
        camera = new ArcRotateCamera(
          'arcRotateCamera',
          camConfig.alpha || -Math.PI / 2,
          camConfig.beta || Math.PI / 3,
          camConfig.radius || 10,
          camConfig.target || Vector3.Zero(),
          this.scene
        );
        
        // Set camera limits for ArcRotate
        const arcCamera = camera as ArcRotateCamera;
        arcCamera.lowerRadiusLimit = 3;
        arcCamera.upperRadiusLimit = 25;
        arcCamera.lowerBetaLimit = 0.1;
        arcCamera.upperBetaLimit = Math.PI / 2;
        
        // Performance optimizations
        arcCamera.useBouncingBehavior = false;
        arcCamera.useAutoRotationBehavior = false;
        arcCamera.useFramingBehavior = false;
        break;
    }

    // Attach camera controls
    camera.attachControl(this.canvas, true);
    
    return camera;
  }

  private setupLighting(): void 
  {
    const lightConfig = this.config.lighting!;
    
    // Hemisphere light (ambient lighting)
    if (lightConfig.ambient) 
    {
      const hemiLight = new HemisphericLight(
        'ambientLight',
        lightConfig.ambient.direction || new Vector3(0, 1, 0),
        this.scene
      );
      hemiLight.intensity = lightConfig.ambient.intensity || 0.4;
      hemiLight.diffuse = lightConfig.ambient.color || new Color3(1, 1, 1);
    }

    // Directional light (sun-like lighting)
    if (lightConfig.directional) 
    {
      const dirLight = new DirectionalLight(
        'directionalLight',
        lightConfig.directional.direction || new Vector3(-1, -1, -1),
        this.scene
      );
      dirLight.intensity = lightConfig.directional.intensity || 0.6;
      dirLight.diffuse = lightConfig.directional.color || new Color3(1, 0.95, 0.8);
    }
  }

  private handleResize(): void 
  {
    if (!this.isDisposed) 
    {
      this.engine.resize();
    }
  }

  // Start the render loop
  public startRenderLoop(): void 
  {
    if (this.renderLoop)
    { 
      return; // Already started
    }
    
    const targetFPS = this.config.performance?.targetFPS || 60;
    const frameTime = 1000 / targetFPS;
    let lastTime = 0;

    const renderFrame = (currentTime: number) => 
    {
      if (this.isDisposed)
      {
         return;
      }

      // Frame rate limiting
      if (currentTime - lastTime >= frameTime) 
      {
        this.scene.render();
        lastTime = currentTime;
      }

      this.renderLoop = requestAnimationFrame(renderFrame);
    };

    this.renderLoop = requestAnimationFrame(renderFrame);
    console.log(`Render loop started - Target FPS: ${targetFPS}`);
  }

  // Stop the render loop
  public stopRenderLoop(): void 
  {
    if (this.renderLoop) 
    {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
      console.log('Render loop stopped');
    }
  }

  // Get the Babylon.js scene - Games use this to add content
  public getScene(): Scene 
  {
    return this.scene;
  }

  // Get the camera - Games can customize or switch cameras
  public getCamera(): Camera 
  {
    return this.camera;
  }

  // Get the engine - For advanced game engine features
  public getEngine(): Engine 
  {
    return this.engine;
  }

  // Update loading state - Games control when loading is shown/hidden
  public setLoadingState(isLoading: boolean, message?: string): void 
  {
    const overlay = document.getElementById('gameLoadingOverlay');
    if (overlay) 
    {
      if (isLoading) 
      {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        
        // Update message if provided
        if (message) 
        {
          const messageElement = overlay.querySelector('.loading-message');
          if (messageElement) 
          {
            messageElement.textContent = message;
          }
        }
      } 
      else 
      {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => 
        {
          overlay.style.display = 'none';
        }, 500);
      }
    }
  }

  // Reconfigure camera
  public reconfigureCamera(newCameraConfig: Partial<CameraConfig>): void 
  {
    this.config.camera = { 
      ...this.config.camera!, 
      ...newCameraConfig
    };
    
    // Dispose old camera
    this.camera.dispose();
    
    // Create new camera
    this.camera = this.setupCamera();
  }

  // Update performance settings
  public updatePerformance(perfConfig: GameCanvasConfig['performance']): void 
  {
    this.config.performance = { ...this.config.performance, ...perfConfig };
    this.setupPerformanceOptimizations();
  }

  // Get performance info
  public getPerformanceInfo(): { fps: number; meshCount: number } 
  {
    return {
      fps: this.engine.getFps(),
      meshCount: this.scene.meshes.length
    };
  }

  // ===== UI RENDERING =====

  public render(): string 
  {
    return `
      <div class="game-canvas-container relative w-full h-full">
        <canvas 
          id="gameCanvas" 
          class="w-full h-full block"
          style="width: 100%; height: 100vh; display: block; background: linear-gradient(to bottom, #0a0a0a, #1a1a2e);"
        ></canvas>
        
        <!-- Generic Loading Overlay -->
        <div 
          id="gameLoadingOverlay" 
          class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
          style="display: none;"
        >
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
            <h3 class="text-white text-xl font-bold mb-2">Loading Game</h3>
            <p class="text-gray-300 loading-message">Initializing 3D scene...</p>
          </div>
        </div>
      </div>
    `;
  }

  public mount(_containerId?: string): void 
  {
    console.log('GameCanvas mounted - Ready for game engine integration');
  }

  // ===== CLEANUP =====

  public dispose(): void 
  {
    this.isDisposed = true;
    
    console.log('GameCanvas disposing...');
    
    // Stop render loop
    this.stopRenderLoop();
    
    // Dispose Babylon.js resources
    if (this.scene) 
    {
      this.scene.dispose();
    }
    
    if (this.engine) 
    {
      this.engine.dispose();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}