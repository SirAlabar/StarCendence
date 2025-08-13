// Complete 3D Rendering Component

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

// Import the managers
import { InputManager, InputCallbacks } from '../../game/managers/InputManager';
import { CameraManager, CameraMode } from '../../game/managers/CameraManager';

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
  lighting?: 
  {
    ambient?: 
    {
      intensity?: number;
      color?: Color3;
      direction?: Vector3;
    };
    directional?: 
    {
      intensity?: number;
      color?: Color3;
      direction?: Vector3;
    };
  };
  
  // Engine configuration
  engine?: 
  {
    antialias?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    preserveDrawingBuffer?: boolean;
  };
  
  // Performance configuration
  performance?: 
  {
    skipPointerPicking?: boolean;
    hardwareScaling?: number;
    targetFPS?: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: Required<GameCanvasConfig> = 
{
  camera: 
  {
    type: 'arcRotate',
    target: Vector3.Zero(),
    radius: 10,
    alpha: -Math.PI / 2,
    beta: Math.PI / 3
  },
  lighting: 
  {
    ambient: 
    {
      intensity: 0.7,
      color: Color3.White(),
      direction: Vector3.Up()
    },
    directional: 
    {
      intensity: 1.0,
      color: Color3.White(),
      direction: new Vector3(-1, -1, -1)
    }
  },
  engine: 
  {
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  },
  performance: 
  {
    skipPointerPicking: true,
    hardwareScaling: 1.0,
    targetFPS: 60
  }
};

export class GameCanvas 
{
  // Core Babylon.js components
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: Camera | null = null;
  
  // Lighting
  private ambientLight: HemisphericLight | null = null;
  private directionalLight: DirectionalLight | null = null;
  
  // Configuration
  private config: Required<GameCanvasConfig>;
  
  // Managers
  private inputManager: InputManager | null = null;
  private cameraManager: CameraManager | null = null;
  
  // State
  private isRenderLoopRunning: boolean = false;

  constructor(canvasId: string, config?: Partial<GameCanvasConfig>) 
  {
    // Merge provided config with defaults
    this.config = this.mergeConfig(config || {});
    
    // Get canvas element
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) 
    {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    
    console.log('🎮 GameCanvas constructor initialized');
    this.initializeBabylonJS();
  }

  // ===== CORE BABYLON.JS SETUP =====

  private initializeBabylonJS(): void 
  {
    try 
    {
      // Initialize engine
      this.engine = this.createEngine();
      
      // Initialize scene
      this.scene = new Scene(this.engine);
      
      // Setup camera
      this.camera = this.setupCamera();
      
      // Setup lighting
      this.setupLighting();
      
      // Setup performance optimizations
      this.setupPerformanceOptimizations();
      
      console.log('🎮 ✅ Babylon.js initialized successfully');
    } 
    catch (error) 
    {
      console.error('🎮 ❌ Failed to initialize Babylon.js:', error);
      throw error;
    }
  }

  private mergeConfig(userConfig: Partial<GameCanvasConfig>): Required<GameCanvasConfig> 
  {
    return {
      camera: { ...DEFAULT_CONFIG.camera, ...userConfig.camera },
      lighting: {
        ambient: { ...DEFAULT_CONFIG.lighting.ambient, ...userConfig.lighting?.ambient },
        directional: { ...DEFAULT_CONFIG.lighting.directional, ...userConfig.lighting?.directional }
      },
      engine: { ...DEFAULT_CONFIG.engine, ...userConfig.engine },
      performance: { ...DEFAULT_CONFIG.performance, ...userConfig.performance }
    };
  }

  private createEngine(): Engine 
  {
    if (!this.canvas)
    {
      throw new Error('Canvas not available');
    }
    
    const engineConfig = this.config.engine;
    
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
    if (!this.scene)
    {
      return;
    }
    
    const perfConfig = this.config.performance;
    
    // Scene optimizations
    if (perfConfig.skipPointerPicking) 
    {
      this.scene.skipPointerMovePicking = true;
      this.scene.skipPointerDownPicking = true;
      this.scene.skipPointerUpPicking = true;
    }
    
    // Hardware scaling
    if (perfConfig.hardwareScaling && this.engine) 
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
    if (!this.scene)
    {
      throw new Error('Scene not available');
    }
    
    const camConfig = this.config.camera;
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
    if (!this.scene) 
    {
      return;
    }
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

  // ===== MANAGER INTEGRATION =====

  public initializeManagers(developmentMode: boolean = false): void 
  {
    if (!this.canvas) 
    {
      console.warn('Canvas not available, cannot initialize managers');
      return;
    }

    // Initialize CameraManager
    this.cameraManager = new CameraManager(this);
    
    // Initialize InputManager with callbacks
    this.inputManager = new InputManager();
    
    const inputCallbacks: InputCallbacks = {
      onMovement: (direction) => {
        if (this.cameraManager)
        {
          this.cameraManager.handleMovement(direction);
        }
      },
      onMouseLook: (deltaX, deltaY) => {
        if (this.cameraManager)
        {
          this.cameraManager.handleMouseLook(deltaX, deltaY);
        }
      },
      onMouseWheel: (delta) => {
        if (this.cameraManager)
        {
          this.cameraManager.handleMouseWheel(delta);
        }
      },
      onCameraSwitch: () => {
        if (this.cameraManager)
        {
          this.cameraManager.cycleCameraMode();
        }
        this.updateCameraUI();
      }
    };

    this.inputManager.initialize(this.canvas, inputCallbacks);

    // Start with appropriate camera mode
    if (developmentMode)
    {
      this.cameraManager.switchToMode(CameraMode.FREE);
    }
    else
    {
      this.cameraManager.switchToMode(CameraMode.RACING);
    }

    console.log(`🎮 Managers initialized (Development: ${developmentMode})`);
    this.updateCameraUI();
  }

  // ===== RENDER LOOP =====

  public startRenderLoop(): void 
  {
    if (!this.engine || !this.scene) 
    {
      console.error('Engine or scene not initialized');
      return;
    }

    if (this.isRenderLoopRunning) 
    {
      console.warn('Render loop already running');
      return;
    }

    this.engine.runRenderLoop(() => {
      // Update input system
      if (this.inputManager)
      {
        this.inputManager.update();
      }
      
      // Render scene
      if (this.scene)
      {
        this.scene.render();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.engine)
      {
        this.engine.resize();
      }
    });

    this.isRenderLoopRunning = true;
    console.log('🎮 Enhanced render loop started with input updates');
  }

  public stopRenderLoop(): void 
  {
    if (this.engine)
    {
      this.engine.stopRenderLoop();
    }
    this.isRenderLoopRunning = false;
    console.log('🎮 Render loop stopped');
  }

  // ===== CAMERA MANAGEMENT =====

  public reconfigureCamera(newCameraConfig: Partial<CameraConfig>): void 
  {
    this.config.camera = { 
      ...this.config.camera, 
      ...newCameraConfig
    };
    
    // Dispose old camera
    if (this.camera)
    {
      this.camera.dispose();
    }
    
    // Create new camera
    this.camera = this.setupCamera();
  }

  public setTrackBounds(bounds: { min: Vector3; max: Vector3; size: Vector3 }): void 
  {
    if (this.cameraManager)
    {
      this.cameraManager.setTrackBounds(bounds);
    }
  }

  public getActiveCamera(): Camera | null 
  {
    return this.camera;
  }

  public switchCameraMode(mode: CameraMode): void 
  {
    if (this.cameraManager)
    {
      this.cameraManager.switchToMode(mode);
    }
    this.updateCameraUI();
  }

  public getCurrentCameraMode(): CameraMode | null 
  {
    if (this.cameraManager)
    {
      return this.cameraManager.getCurrentMode();
    }
    return null;
  }

  public setDevelopmentMode(enabled: boolean): void 
  {
    if (enabled && this.cameraManager) 
    {
      this.cameraManager.switchToMode(CameraMode.FREE);
    } 
    else if (!enabled && this.cameraManager) 
    {
      this.cameraManager.switchToMode(CameraMode.RACING);
    }
    
    this.updateCameraUI();
    console.log(`🎮 Development mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  // ===== SCENE ACCESS =====

  public getScene(): Scene | null 
  {
    return this.scene;
  }

  public getEngine(): Engine | null 
  {
    return this.engine;
  }

  public getCanvas(): HTMLCanvasElement | null 
  {
    return this.canvas;
  }

  public getCamera(): Camera | null 
  {
    return this.camera;
  }

  // ===== LOADING OVERLAY =====

  public showLoadingOverlay(isLoading: boolean, message?: string): void 
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
        
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 500);
      }
    }
  }

  public setLoadingState(isLoading: boolean, message?: string): void 
  {
    this.showLoadingOverlay(isLoading, message);
  }

  // ===== PERFORMANCE =====

  public updatePerformance(perfConfig: GameCanvasConfig['performance']): void 
  {
    this.config.performance = { ...this.config.performance, ...perfConfig };
    this.setupPerformanceOptimizations();
  }

  public getPerformanceInfo(): { fps: number; meshCount: number } 
  {
    const fps = this.engine ? this.engine.getFps() : 0;
    const meshCount = this.scene ? this.scene.meshes.length : 0;
    
    return {
      fps: fps,
      meshCount: meshCount
    };
  }

  // ===== UI UPDATES =====

  private updateCameraUI(): void 
  {
    if (!this.cameraManager)
    {
      return;
    }

    const currentMode = this.cameraManager.getCurrentMode();
    const modeInfo = this.cameraManager.getModeInfo(currentMode);
    
    // Update UI element if it exists
    const cameraInfo = document.getElementById('cameraInfo');
    if (cameraInfo && modeInfo) 
    {
      cameraInfo.textContent = `Camera: ${modeInfo.name}`;
    }

    // Update track info to include camera controls
    const trackInfo = document.getElementById('trackInfo');
    if (trackInfo) 
    {
      const currentText = trackInfo.textContent || '';
      if (!currentText.includes('F1')) 
      {
        const modeInfoName = modeInfo ? modeInfo.name : 'Unknown';
        trackInfo.innerHTML = `
          ${currentText}<br>
          <span class="text-xs text-purple-300">F1: Switch Camera (${modeInfoName})</span>
        `;
      }
    }
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
    // This is called after the HTML is inserted into the DOM
    // Babylon.js initialization happens in constructor
    console.log('🎮 GameCanvas mounted to DOM');
  }

  // ===== CLEANUP =====

  public dispose(): void 
  {
    console.log('🎮 Disposing GameCanvas and managers...');
    
    // Stop render loop
    this.stopRenderLoop();
    
    // Dispose managers
    if (this.inputManager)
    {
      this.inputManager.dispose();
    }
    if (this.cameraManager)
    {
      this.cameraManager.dispose();
    }
    this.inputManager = null;
    this.cameraManager = null;

    // Dispose Babylon.js resources
    if (this.ambientLight)
    {
      this.ambientLight.dispose();
    }
    if (this.directionalLight)
    {
      this.directionalLight.dispose();
    }
    if (this.camera)
    {
      this.camera.dispose();
    }
    if (this.scene)
    {
      this.scene.dispose();
    }
    if (this.engine)
    {
      this.engine.dispose();
    }
    
    console.log('✅ GameCanvas disposed');
  }
}