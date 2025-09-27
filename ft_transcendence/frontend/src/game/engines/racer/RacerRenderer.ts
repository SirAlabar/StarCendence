import { GameCanvas } from './GameCanvas';
import { RacerScene } from './RacerScene';
import { RacerPod } from './RacerPods';
import { RacerUIManager } from '../../managers/RacerUIManager';
import { PodConfig } from '../../utils/PodConfig';

export interface RacerRendererConfig 
{
  debugMode?: boolean;
  performanceMonitoring?: boolean;
  cameraMode?: 'racing' | 'free' | 'player';
}

export class RacerRenderer 
{
  private gameCanvas: GameCanvas | null = null;
  private racerScene: RacerScene | null = null;
  private playerPod: RacerPod | null = null;
  private racerUIManager: RacerUIManager | null = null;
  private loadingOverlay: HTMLElement | null = null;
  private isLoadingActive: boolean = false;
  private config: RacerRendererConfig;
  private isInitialized: boolean = false;
  private hudUpdateInterval: number | null = null;
  
  // Callbacks for UI updates
  public onLoadingProgress: ((message: string, progress: number, stage: string) => void) | null = null;
  public onTrackLoaded: ((track: any) => void) | null = null;
  public onPodLoaded: ((pod: RacerPod) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  
  constructor(config?: RacerRendererConfig) 
  {
    this.config = 
    {
      debugMode: false,
      performanceMonitoring: false,
      ...config
    };
  }
  
  public async initialize(canvasId: string, selectedPod: PodConfig): Promise<void> 
  {
    try 
    {
      this.createLoadingOverlay();
      this.showLoading();
      this.initializeParticles();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.updateLoadingProgress('Creating 3D scene...', 10, 'canvas');
      this.gameCanvas = new GameCanvas(canvasId);
      await this.gameCanvas.initialize();
      
      this.updateLoadingProgress('Setting up camera controls...', 20, 'physics');
      this.gameCanvas.initializeManagers(this.config.debugMode || false);
      this.gameCanvas.startRenderLoop();
      
      await this.initializeVisualTrack();
      await this.setupLocalPhysics();
      await this.loadPlayerPod(selectedPod);
      
      this.isInitialized = true;
      this.updateLoadingProgress('Racing scene ready!', 100, 'pod');
      
      setTimeout(() => 
      {
        this.hideLoading();
      }, 1000);
      
    } 
    catch (error) 
    {
      console.error('Initialization failed:', error);
      this.hideLoading();
      this.showLoadingError(`Initialization failed: ${error}`);
      
      if (this.onError) 
      {
        this.onError(`Failed to initialize 3D racing scene: ${error}`);
      }
      throw error;
    }
  }
  
  public async startVisualRace(): Promise<void> 
  {
    if (!this.isInitialized) 
    {
      throw new Error('RacerRenderer not initialized');
    }
    
    this.racerUIManager = new RacerUIManager(
    {
      showHUD: true,
      showDebugInfo: this.config.debugMode || false,
      maxSpeed: 600,
      totalLaps: 3,
      totalRacers: 8
    });
    
    this.racerUIManager.startRace();
    
    // Start HUD update loop for real-time speed display
    this.startHUDUpdateLoop();
  }

  private startHUDUpdateLoop(): void 
  {
    if (this.hudUpdateInterval) 
    {
      clearInterval(this.hudUpdateInterval);
    }

    this.hudUpdateInterval = setInterval(() => 
    {
      this.updateHUDFromPhysics();
    }, 50) as unknown as number; // 20fps for HUD updates
  }

  private updateHUDFromPhysics(): void 
  {
    if (!this.racerUIManager || !this.gameCanvas || !this.playerPod) 
    {
      return;
    }

    const physics = this.gameCanvas.getPhysics();
    if (!physics) 
    {
      return;
    }

    const podId = this.playerPod.getConfig().id;
    const currentSpeed = physics.getSpeed(podId);
    
    // Convert to km/h for display
    const speedKmh = Math.round(currentSpeed * 3.6);
    
    this.racerUIManager.updateSpeed(speedKmh);
  }

  public toggleDebugMode(): void 
  {
    this.config.debugMode = !this.config.debugMode;
    
    if (this.gameCanvas) 
    {
      const cameraManager = this.gameCanvas['cameraManager']; // Access private member
      if (cameraManager && typeof cameraManager.setDevelopmentMode === 'function') 
      {
        cameraManager.setDevelopmentMode(this.config.debugMode);
      }
    }
  }

    private async setupLocalPhysics(): Promise<void> 
    {
    if (!this.gameCanvas || !this.racerScene) 
    {
        return;
    }
    
    const physics = this.gameCanvas.getPhysics();
    if (!physics || !physics.isPhysicsReady()) 
    {
        return;
    }

    const trackMesh = this.racerScene.getTrack();
    if (trackMesh) 
    {
        await physics.setupTrackCollision(this.racerScene);
    }
    }
  
  private async initializeVisualTrack(): Promise<void> 
  {
    if (!this.gameCanvas) 
    {
      return;
    }
    
    this.updateLoadingProgress('Loading racing track...', 30, 'track');
    
    this.racerScene = new RacerScene(this.gameCanvas);
    
    this.racerScene.onLoadingProgress = (percentage, asset) => 
    {
      this.updateLoadingProgress(`Loading ${asset}...`, 30 + (percentage * 0.4), 'track');
    };
    
    this.racerScene.onTrackLoaded = (track) => 
    {
        if (this.gameCanvas) 
        {
            const cameraManager = this.gameCanvas.getCameraManager();
            if (cameraManager) 
            {
                cameraManager.setTrackBounds(this.racerScene!.getTrackBounds());
            }
        }
      
      if (this.onTrackLoaded) 
      {
        this.onTrackLoaded(track);
      }
    };
    
    await this.racerScene.loadTrack();
  }
  
  private async loadPlayerPod(selectedPod: PodConfig): Promise<void> 
  {
    if (!this.gameCanvas || !this.racerScene) 
    {
      throw new Error('Missing dependencies for pod loading');
    }
    
    this.updateLoadingProgress(`Loading ${selectedPod.name}...`, 70, 'pod');
    
    try 
    {
      if (this.playerPod) 
      {
        this.playerPod.dispose();
        this.playerPod = null;
      }
      
      this.playerPod = new RacerPod(this.gameCanvas.getScene()!, selectedPod);
      
      this.playerPod.onLoaded = (pod) => 
      {
        const startPositions = this.racerScene!.getStartingPositions(4);
              
        const playerStartPos = startPositions[0];
        
        pod.setPosition(playerStartPos);

        pod.initializeCheckpoints(this.racerScene!);
        
        this.gameCanvas!.setPlayerPod(pod);
        
        const physics = this.gameCanvas!.getPhysics();
        if (physics && physics.isPhysicsReady()) 
        {
          pod.enablePhysics(physics, playerStartPos);
        }
        
        console.log(`Player pod loaded at position: ${playerStartPos}`);
        
        if (this.onPodLoaded) 
        {
          this.onPodLoaded(pod);
        }
      };
      
      this.playerPod.onLoadingError = (error) => 
      {
        console.error('Pod loading error:', error);
        if (this.onError) 
        {
          this.onError(`Failed to load pod: ${error}`);
        }
      };
      
      await this.playerPod.loadModel();
      
    } 
    catch (error) 
    {
      console.error('Pod loading failed:', error);
      throw error;
    }
  }
  
  private createLoadingOverlay(): void 
  {
    const loadingHTML = `
      <div id="racerLoadingOverlay" class="fixed inset-0 bg-black/90 flex items-center justify-center" style="z-index: 2000;">
        <canvas id="racerParticleCanvas" class="absolute inset-0 w-full h-full"></canvas>
        
        <div class="relative z-10 text-center">
          <div class="relative w-32 h-32 mx-auto mb-8">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="rgb(75 85 99)" 
                stroke-width="4"
              />
              <circle 
                id="racerProgressCircle"
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="rgb(147 51 234)" 
                stroke-width="4"
                stroke-linecap="round"
                stroke-dasharray="314"
                stroke-dashoffset="314"
                class="transition-all duration-300 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span id="racerProgressPercent" class="text-white text-xl font-bold">0%</span>
            </div>
          </div>

          <h3 class="text-white text-2xl font-bold mb-4">Loading Race</h3>
          <p class="text-gray-300 text-lg" id="racerLoadingMessage">Preparing 3D scene...</p>
          
          <div class="mt-6 flex justify-center space-x-4">
            <div id="racerStageCanvas" class="flex items-center text-gray-500">
              <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              <span class="text-sm">Canvas</span>
            </div>
            <div id="racerStagePhysics" class="flex items-center text-gray-500">
              <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              <span class="text-sm">Physics</span>
            </div>
            <div id="racerStageTrack" class="flex items-center text-gray-500">
              <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              <span class="text-sm">Track</span>
            </div>
            <div id="racerStagePod" class="flex items-center text-gray-500">
              <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              <span class="text-sm">Pod</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
    this.loadingOverlay = document.getElementById('racerLoadingOverlay');
  }
  
  private showLoading(): void 
  {
    if (this.loadingOverlay) 
    {
      this.loadingOverlay.style.display = 'flex';
      this.isLoadingActive = true;
    }
  }
  
  private hideLoading(): void 
  {
    if (this.loadingOverlay) 
    {
      this.loadingOverlay.style.display = 'none';
      this.isLoadingActive = false;
    }
  }
  
  private showLoadingError(errorMessage: string): void 
  {
    const messageElement = document.getElementById('racerLoadingMessage');
    if (messageElement) 
    {
      messageElement.innerHTML = `<span class="text-red-400">Error: ${errorMessage}</span>`;
    }
    
    setTimeout(() => 
    {
      if (this.loadingOverlay) 
      {
        const contentDiv = this.loadingOverlay.querySelector('.relative.z-10');
        if (contentDiv) 
        {
          contentDiv.insertAdjacentHTML('beforeend', `
            <div class="mt-4">
              <button onclick="location.reload()" 
                      class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mr-2">
                Retry
              </button>
              <button onclick="history.back()" 
                      class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Back
              </button>
            </div>
          `);
        }
      }
    }, 2000);
  }
  
  private updateLoadingProgress(message: string, progress: number, stage: string): void 
  {
    const messageElement = document.getElementById('racerLoadingMessage');
    if (messageElement) 
    {
      messageElement.textContent = message;
    }

    const progressCircle = document.getElementById('racerProgressCircle');
    const progressPercent = document.getElementById('racerProgressPercent');
    
    if (progressCircle && progressPercent) 
    {
      const circumference = 314;
      const offset = circumference - (progress / 100) * circumference;
      progressCircle.style.strokeDashoffset = offset.toString();
      progressPercent.textContent = `${Math.round(progress)}%`;
    }

    const stageElement = document.getElementById(`racerStage${stage.charAt(0).toUpperCase() + stage.slice(1)}`);
    if (stageElement) 
    {
      stageElement.className = 'flex items-center text-purple-400';
      const dot = stageElement.querySelector('.w-3.h-3.rounded-full');
      if (dot) 
      {
        dot.className = 'w-3 h-3 rounded-full bg-purple-400 mr-2 animate-pulse';
      }
    }
    
    if (this.onLoadingProgress) 
    {
      this.onLoadingProgress(message, progress, stage);
    }
  }
  
  private initializeParticles(): void 
  {
    const canvas = document.getElementById('racerParticleCanvas') as HTMLCanvasElement;
    if (!canvas) 
    {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) 
    {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<
    {
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      size: number; 
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) 
    {
      particles.push(
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => 
    {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => 
      {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) 
        {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) 
        {
          particle.vy *= -1;
        }

        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (this.isLoadingActive) 
      {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Essential getters only
  public getGameCanvas(): GameCanvas | null 
  {
    return this.gameCanvas;
  }
  
  public isReady(): boolean 
  {
    return this.isInitialized && this.gameCanvas !== null && this.playerPod !== null;
  }
  
  public dispose(): void 
  {
    this.isLoadingActive = false;
    
    if (this.hudUpdateInterval) 
    {
      clearInterval(this.hudUpdateInterval);
      this.hudUpdateInterval = null;
    }
    
    if (this.loadingOverlay) 
    {
      this.loadingOverlay.remove();
      this.loadingOverlay = null;
    }
    
    if (this.playerPod) 
    {
      this.playerPod.dispose();
      this.playerPod = null;
    }
    
    if (this.racerUIManager) 
    {
      this.racerUIManager.dispose();
      this.racerUIManager = null;
    }
    
    if (this.racerScene) 
    {
      this.racerScene.dispose();
      this.racerScene = null;
    }

    if (this.gameCanvas) 
    {
        const physics = this.gameCanvas.getPhysics();
        if (physics) 
        {
            // physics.clearPhysicsDebugHUD();
        }

      this.gameCanvas.dispose();
      this.gameCanvas = null;
    }

    this.isInitialized = false;
  }
}