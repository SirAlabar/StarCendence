import { 
  Engine, 
  Scene, 
  HemisphericLight, 
  DirectionalLight,
  Vector3, 
  Color3,
  Camera
} from '@babylonjs/core';

import { InputManager, InputCallbacks, CameraMode } from '../../managers/InputManager';
import { CameraManager } from '../../managers/CameraManager';
import { RacerPod } from './RacerPods';
import { RacerPhysics } from './RacerPhysics';

export interface GameCanvasConfig 
{
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
  
  engine?: 
  {
    antialias?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    preserveDrawingBuffer?: boolean;
  };
  
  performance?: 
  {
    skipPointerPicking?: boolean;
    hardwareScaling?: number;
    targetFPS?: number;
  };
}

const DEFAULT_CONFIG: Required<GameCanvasConfig> = 
{
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
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  
  private ambientLight: HemisphericLight | null = null;
  private directionalLight: DirectionalLight | null = null;
  
  private config: Required<GameCanvasConfig>;

  private racerPhysics: RacerPhysics | null = null;
  
  private inputManager: InputManager | null = null;
  private cameraManager: CameraManager | null = null;
  
  private playerPod: RacerPod | null = null;
  
  private isRenderLoopRunning: boolean = false;

  constructor(canvasId: string, config?: Partial<GameCanvasConfig>) 
  {
    this.config = this.mergeConfig(config || {});
    
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) 
    {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    
    if (!(canvasElement instanceof HTMLCanvasElement)) 
    {
      throw new Error(`Element with id '${canvasId}' is not a canvas element`);
    }
    
    this.canvas = canvasElement;
    
    console.log('GameCanvas constructor initialized');
    this.initializeBabylonJS();
  }

  public async initialize(): Promise<void> 
  {
    await this.initializePhysics();
  }

  private initializeBabylonJS(): void 
  {
    try 
    {
      this.engine = this.createEngine();
      this.scene = new Scene(this.engine);
      this.setupLighting();
      this.setupPerformanceOptimizations();
      
      console.log('Babylon.js initialized successfully');
    } 
    catch (error) 
    {
      console.error('Failed to initialize Babylon.js:', error);
      throw error;
    }
  }

  private async initializePhysics(): Promise<void> 
  {
    if (!this.scene) 
    {
      console.error('Scene not available for physics');
      return;
    }

    try 
    {
      console.log('Initializing physics system...');
      this.racerPhysics = new RacerPhysics(this.scene);
      await this.racerPhysics.initialize();
      console.log('Physics system ready');
    } 
    catch (error) 
    {
      console.error('Failed to initialize physics:', error);
      throw error;
    }
  }

  private mergeConfig(userConfig: Partial<GameCanvasConfig>): Required<GameCanvasConfig> 
  {
    return {
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
    
    if (perfConfig.skipPointerPicking) 
    {
      this.scene.skipPointerMovePicking = true;
      this.scene.skipPointerDownPicking = true;
      this.scene.skipPointerUpPicking = true;
    }
    
    if (perfConfig.hardwareScaling && this.engine) 
    {
      this.engine.setHardwareScalingLevel(perfConfig.hardwareScaling);
    }
    
    if (this.scene.audioEnabled) 
    {
      this.scene.headphone = true;
    }
  }

  private setupLighting(): void 
  {
    if (!this.scene) 
    {
      return;
    }
    const lightConfig = this.config.lighting!;
    
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

  public setPlayerPod(pod: RacerPod | null): void 
  {
    console.log(`🎯 GameCanvas.setPlayerPod() called`);
    console.log(`🎯 Setting player pod: ${pod?.getConfig().name || 'none'}`);
    console.log(`🎯 Has racerPhysics: ${!!this.racerPhysics}`);
    console.log(`🎯 Physics ready: ${this.racerPhysics?.isPhysicsReady()}`);
    
    this.playerPod = pod;

    if (pod && this.racerPhysics && this.racerPhysics.isPhysicsReady()) 
    {
      console.log(`🎯 Enabling physics for pod`);
      pod.enablePhysics(this.racerPhysics);
      console.log(`🎯 Pod physics enabled`);
    }
    else 
    {
      console.warn(`🎯 Cannot enable physics:`, {
        hasPod: !!pod,
        hasPhysics: !!this.racerPhysics,
        physicsReady: this.racerPhysics?.isPhysicsReady()
      });
    }

    if (this.cameraManager) 
    {
      console.log(`🎯 Setting pod in camera manager`);
      this.cameraManager.setPlayerPod(pod);
    }

    if (this.inputManager) 
    {
      console.log(`🎯 Setting pod in input manager`);
      this.inputManager.setPlayerPod(pod);
    }
    
    console.log(`🎯 GameCanvas.setPlayerPod() completed`);
  }

  public getPlayerPod(): RacerPod | null 
  {
    return this.playerPod;
  }

  public clearPlayerPod(): void 
  {
    this.playerPod = null;
    
    if (this.cameraManager) 
    {
      this.cameraManager.setPlayerPod(null);
    }

    if (this.inputManager) 
    {
      this.inputManager.setPlayerPod(null);
    }
    
    console.log('Player pod cleared');
  }

  public initializeManagers(developmentMode: boolean = false): void 
  {
    if (!this.scene || !this.canvas) 
    {
      console.error('Cannot initialize managers: scene or canvas not ready');
      return;
    }

    this.cameraManager = new CameraManager(this);
    
    if (this.playerPod) 
    {
      this.cameraManager.setPlayerPod(this.playerPod);
    }
    
    this.inputManager = new InputManager();
    
    const inputCallbacks: InputCallbacks = {
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
          this.updateInputManagerReferences();
        }
        this.updateCameraUI();
      }
    };

    this.inputManager.initialize(this.canvas, inputCallbacks);
    this.updateInputManagerReferences();

    if (developmentMode)
    {
      this.switchCameraMode(CameraMode.FREE);
    }
    else
    {
      this.switchCameraMode(CameraMode.RACING);
    }

    console.log(`Managers initialized (Development: ${developmentMode})`);
    this.updateCameraUI();
  }

  private updateInputManagerReferences(): void 
  {
    if (!this.inputManager || !this.cameraManager) 
    {
      return;
    }

    const currentMode = this.cameraManager.getCurrentMode();
    this.inputManager.setCameraMode(currentMode);
    this.inputManager.setPlayerPod(this.playerPod);
    this.inputManager.setFreeCamera(this.cameraManager.getFreeCamera());
  }

  public startRenderLoop(): void 
  {
    if (!this.engine || !this.scene || this.isRenderLoopRunning) 
    {
      return;
    }

    this.isRenderLoopRunning = true;
    
    this.engine.runRenderLoop(() => 
    {
      if (this.inputManager)
      {
        this.inputManager.update();
      }

      if (this.scene)
      {
        this.scene.render();
      }
    });

    window.addEventListener('resize', () => {
      if (this.engine)
      {
        this.engine.resize();
      }
    });
    
    console.log('Render loop started');
  }

  public stopRenderLoop(): void 
  {
    if (this.engine)
    {
      this.engine.stopRenderLoop();
    }
    this.isRenderLoopRunning = false;
    console.log('Render loop stopped');
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
    if (this.cameraManager) 
    {
      return this.cameraManager.getActiveCamera();
    }
    return this.scene?.activeCamera || null;
  }

  public switchCameraMode(mode: CameraMode): void 
  {
    if (this.cameraManager)
    {
      this.cameraManager.switchToMode(mode);
      this.updateInputManagerReferences();
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
    if (enabled) 
    {
      this.switchCameraMode(CameraMode.FREE);
    } 
    else 
    {
      this.switchCameraMode(CameraMode.RACING);
    }
    
    this.updateCameraUI();
    console.log(`Development mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  public enablePlayerMode(): void 
  {
    this.switchCameraMode(CameraMode.PLAYER);
    console.log('Player camera mode enabled');
  }

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

  public getPhysics(): RacerPhysics | null 
  {
    return this.racerPhysics;
  }
  
  public hasPhysics(): boolean 
  {
    return this.racerPhysics !== null && this.racerPhysics.isPhysicsReady();
  }

  public getCamera(): Camera | null 
  {
    return this.getActiveCamera();
  }

  public showLoadingOverlay(isLoading: boolean, message?: string): void 
  {
    const overlay = document.getElementById('gameLoadingOverlay');
    if (overlay) 
    {
      if (isLoading) 
      {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        
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

  private updateCameraUI(): void 
  {
    if (!this.cameraManager)
    {
      return;
    }

    const currentMode = this.cameraManager.getCurrentMode();
    const modeInfo = this.cameraManager.getCameraInfo(currentMode);
    
    const cameraInfo = document.getElementById('cameraInfo');
    if (cameraInfo && modeInfo) 
    {
      cameraInfo.textContent = `Camera: ${modeInfo.name}`;
    }

    const trackInfo = document.getElementById('trackInfo');
    if (trackInfo) 
    {
      const currentText = trackInfo.textContent || '';
      if (!currentText.includes('F1')) 
      {
        const modeInfoName = modeInfo ? modeInfo.name : 'Unknown';
        const controlsText = this.getControlsText(currentMode);
        
        trackInfo.innerHTML = `
          ${currentText}<br>
          <span class="text-xs text-purple-300">F1: Switch Camera (${modeInfoName})</span><br>
          <span class="text-xs text-blue-300">${controlsText}</span>
        `;
      }
    }
  }

  private getControlsText(mode: CameraMode): string 
  {
    switch (mode) 
    {
      case CameraMode.RACING:
        return 'Mouse: Rotate View | Scroll: Zoom';
      case CameraMode.FREE:
        return 'WASD: Move Camera | Mouse: Look Around | Scroll: Speed';
      case CameraMode.PLAYER:
        return 'WASD: Move Pod | Mouse: Camera Control | Scroll: Zoom';
      default:
        return '';
    }
  }

  public render(): string 
  {
    return `
      <div class="game-canvas-container relative w-full h-full">
        <canvas 
          id="gameCanvas" 
          class="w-full h-full block"
          style="width: 100%; height: 100vh; display: block; background: linear-gradient(to bottom, #0a0a0a, #1a1a2e);"
        ></canvas>
        
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
    console.log('GameCanvas mounted to DOM');
  }

  public dispose(): void 
  {
    console.log('Disposing GameCanvas and managers...');
    
    this.stopRenderLoop();
    this.clearPlayerPod();
    
    if (this.racerPhysics) 
    {
      this.racerPhysics.dispose();
      this.racerPhysics = null;
    }

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

    if (this.ambientLight)
    {
      this.ambientLight.dispose();
    }
    if (this.directionalLight)
    {
      this.directionalLight.dispose();
    }
    if (this.scene)
    {
      this.scene.dispose();
    }
    if (this.engine)
    {
      this.engine.dispose();
    }
    
    console.log('GameCanvas disposed');
  }
}