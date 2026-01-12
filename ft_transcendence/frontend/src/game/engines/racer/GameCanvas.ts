import { 
  Engine, 
  Scene, 
  HemisphericLight, 
  DirectionalLight,
  Vector3, 
  Color3
} from '@babylonjs/core';
import '@babylonjs/inspector';

import { InputManager, InputCallbacks } from '../../managers/InputManager';
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
    } 
    catch (error) 
    {
      throw error;
    }
  }

  private async initializePhysics(): Promise<void> 
  {
    if (!this.scene) 
    {
      return;
    }

    try 
    {
      this.racerPhysics = new RacerPhysics(this.scene);
      await this.racerPhysics.initialize();
    } 
    catch (error) 
    {
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
    
    const lightConfig = this.config.lighting;
    
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
    this.playerPod = pod;

    if (pod && this.racerPhysics && this.racerPhysics.isPhysicsReady()) 
    {
      pod.enablePhysics(this.racerPhysics);
    }

    if (this.cameraManager) 
    {
      this.cameraManager.setCameraTarget(pod);
    }

    if (this.inputManager && this.racerPhysics && pod) 
    {
      this.inputManager.setPhysicsSystem(this.racerPhysics, pod.getConfig().id);
    }
  }

  public initializeManagers(): void 
  {
    if (!this.scene || !this.canvas) 
    {
      return;
    }

    this.cameraManager = new CameraManager(this);
    
    if (this.playerPod) 
    {
      this.cameraManager.setCameraTarget(this.playerPod);
    }
    
    this.inputManager = new InputManager();
    
    const inputCallbacks: InputCallbacks = 
    {
      onMouseWheel: (delta) => 
      {
        if (this.cameraManager) 
        {
          this.cameraManager.handleMouseWheel(delta);
        }
      },
      onCameraSwitch: () => 
      {
        if (this.cameraManager) 
        {
          this.cameraManager.cycleCameraMode();
        }
      },
    };

    this.inputManager.initialize(this.canvas, inputCallbacks);
    
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

    window.addEventListener('resize', () => 
    {
      if (this.engine) 
      {
        this.engine.resize();
      }
    });
  }

  public stopRenderLoop(): void 
  {
    if (this.engine) 
    {
      this.engine.stopRenderLoop();
    }
    this.isRenderLoopRunning = false;
  }

  // Essential getters only
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

  public getPlayerPod(): RacerPod | null 
  {
    return this.playerPod;
  }

  public getPerformanceInfo(): { fps: number; meshCount: number } 
  {
    const fps = this.engine ? this.engine.getFps() : 0;
    const meshCount = this.scene ? this.scene.meshes.length : 0;
    return { fps, meshCount };
  }

  public setTrackBounds(bounds: { min: Vector3; max: Vector3; size: Vector3 }): void 
  {
    if (this.cameraManager) 
    {
      this.cameraManager.setTrackBounds(bounds);
    }
  }

  public getCameraManager(): CameraManager | null 
  {
    return this.cameraManager;
  }

  public dispose(): void 
  {
    this.stopRenderLoop();
    
    if (this.inputManager) 
    {
      this.inputManager.dispose();
      this.inputManager = null;
    }
    
    if (this.cameraManager) 
    {
      this.cameraManager.dispose();
      this.cameraManager = null;
    }
    
    if (this.racerPhysics) 
    {
      this.racerPhysics.dispose();
      this.racerPhysics = null;
    }
    
    if (this.scene) 
    {
      this.scene.dispose();
      this.scene = null;
    }
    
    if (this.engine) 
    {
      this.engine.dispose();
      this.engine = null;
    }
    
    this.playerPod = null;
  }
  
  public showInspector(): void 
  {
    if (this.scene) 
    {
      this.scene.debugLayer.show({
        embedMode: false,
        overlay: true,
        showExplorer: true,
        showInspector: true
      });
    }
  }

  public hideInspector(): void 
  {
    if (this.scene) 
    {
      this.scene.debugLayer.hide();
    }
  }

  public toggleInspector(): void 
  {
    if (this.scene) 
    {
      if (this.scene.debugLayer.isVisible()) 
      {
        this.hideInspector();
      } 
      else 
      {
        this.showInspector();
      }
    }
}

}

