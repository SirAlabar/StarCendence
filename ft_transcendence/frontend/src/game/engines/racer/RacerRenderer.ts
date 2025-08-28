// ====================================================
// RacerRenderer.ts - VISUAL GAME CONTROLLER (FRONTEND)
// ====================================================
import { GameCanvas } from './GameCanvas';
import { RacerScene } from './RacerScene';
import { RacerPhysics } from './RacerPhysics';
import { RacerPod } from './RacerPods';
import { RacerUIManager } from '../../managers/RacerUIManager';
// import { RacerTrack } from './RacerTrack';
// import { RacerCheckpoints } from './RacerCheckpoints';
// import { RacerZones } from './RacerZones';
// import { InputHandler } from './InputHandler';
// import { RaceWebSocketClient } from './RaceWebSocketClient';
import { PodConfig } from '../../utils/PodConfig';
import { Vector3 } from '@babylonjs/core';

export interface RacerRendererConfig 
{
  debugMode?: boolean;
  performanceMonitoring?: boolean;
  cameraMode?: 'racing' | 'free' | 'player';
}

export interface ServerRaceState 
{
  raceId: string;
  isActive: boolean;
  players: { [podId: string]: { position: Vector3; rotation: Vector3; speed: number } };
  leaderboard: { podId: string; position: number; lap: number; time: number }[];
  currentTime: number;
}

export class RacerRenderer 
{
  // Core 3D components
  private gameCanvas: GameCanvas | null = null;
  private racerScene: RacerScene | null = null;
  private racerPhysics: RacerPhysics | null = null;
  private playerPod: RacerPod | null = null;
  
  // Visual track system - TODO: Implement when files are created
  // private racerTrack: RacerTrack | null = null;
  // private checkpoints: RacerCheckpoints | null = null;
  // private zones: RacerZones | null = null;
  
  // Input and communication - TODO: Implement when backend is ready
  // private inputHandler: InputHandler | null = null;
  // private webSocketClient: RaceWebSocketClient | null = null;
  
  // UI Management
  private racerUIManager: RacerUIManager | null = null;
  
  // Loading system
  private loadingOverlay: HTMLElement | null = null;
  private isLoadingActive: boolean = false;
  
  // Visual state
  private config: RacerRendererConfig;
  private isInitialized: boolean = false;
  private isVisualRaceActive: boolean = false;
  private otherPlayerPods: Map<string, RacerPod> = new Map();
  
  // Callbacks for UI updates
  public onLoadingProgress: ((message: string, progress: number, stage: string) => void) | null = null;
  public onTrackLoaded: ((track: any) => void) | null = null;
  public onPodLoaded: ((pod: RacerPod) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  
  constructor(config?: RacerRendererConfig) 
  {
    this.config = {
      debugMode: false,
      performanceMonitoring: false,
      cameraMode: 'racing',
      ...config
    };
  }
  
  // Main lifecycle methods
  public async initialize(canvasId: string, selectedPod: PodConfig): Promise<void> 
  {
    try 
    {
      console.log('RACER-RENDERER: Starting initialization...');
      
      // Create and show loading overlay
      this.createLoadingOverlay();
      this.showLoading();
      this.initializeParticles();
      
      // Add a small delay to ensure loading overlay is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize 3D engine
      this.updateLoadingProgress('Creating 3D scene...', 10, 'canvas');
      this.gameCanvas = new GameCanvas(canvasId);
      await this.gameCanvas.initialize();
      
      this.updateLoadingProgress('Setting up camera controls...', 20, 'physics');
      this.gameCanvas.initializeManagers(this.config.debugMode || false);
      this.gameCanvas.startRenderLoop();
      
      // Load track first
      await this.initializeVisualTrack();
      
      // Setup physics after track is loaded
      await this.setupLocalPhysics();
      
      // Load player pod
      await this.loadPlayerPod(selectedPod);
      
      // Setup additional systems
      await this.loadVisualAssets();
      
      this.isInitialized = true;
      this.updateLoadingProgress('Racing scene ready!', 100, 'pod');
      
      // Hide loading after a brief delay
      setTimeout(() => 
      {
        this.hideLoading();
      }, 1000);
      
      console.log('RACER-RENDERER: Initialization complete');
      
    } 
    catch (error) 
    {
      console.error('RACER-RENDERER: Initialization failed:', error);
      
      // Always hide loading on error
      this.hideLoading();
      
      // Show error message if loading overlay still exists
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
    
    console.log('RACER-RENDERER: Starting visual race...');
    
    // Initialize and start Racer UI Manager
    this.racerUIManager = new RacerUIManager(
    {
      showHUD: true,
      showDebugInfo: this.config.debugMode || false,
      maxSpeed: 500,
      totalLaps: 3,
      totalRacers: 8
    });
    
    this.racerUIManager.startRace();
    
    // this.racerUIManager.simulateRacerData(); //For testing UI

    // Setup local input handling
    this.setupLocalInput();
    
    // TODO: Connect to backend when WebSocket is implemented
    // await this.setupWebSocketConnection();
    
    this.isVisualRaceActive = true;
    
    // Start performance monitoring if enabled
    if (this.config.performanceMonitoring) 
    {
      this.startPerformanceMonitoring();
    }
  }
  
  public stopVisualRace(): void 
  {
    console.log('RACER-RENDERER: Stopping visual race...');
    this.isVisualRaceActive = false;
    
    // Stop UI Manager
    if (this.racerUIManager) 
    {
      this.racerUIManager.stopRace();
    }
    
    // Stop render loop immediately
    if (this.gameCanvas) 
    {
      this.gameCanvas.stopRenderLoop();
    }
    
    // TODO: Disconnect WebSocket when implemented
    // this.webSocketClient?.disconnect();
  }
  
  public resetVisuals(): void 
  {
    console.log('RACER-RENDERER: Resetting visuals...');
    
    // Reset player pod position
    if (this.playerPod && this.racerScene) 
    {
      const startPos = this.racerScene.getStartingPositions(1)[0];
      if (startPos) 
      {
        this.playerPod.setPosition(startPos);
      }
    }
    
    // Reset camera
    if (this.gameCanvas) 
    {
      this.gameCanvas.switchCameraMode(this.config.cameraMode || 'racing');
    }
    
    // Clear other players
    this.otherPlayerPods.clear();
  }
  
  // Server synchronization - TODO: Implement when backend is ready
  public processServerUpdate(raceState: ServerRaceState): void 
  {
    // TODO: Process race state from backend
    console.log('RACER-RENDERER: Processing server update (TODO)');
  }
  
  public syncPodPositions(playerPositions: any): void 
  {
    // TODO: Sync positions from authoritative server
    console.log('RACER-RENDERER: Syncing pod positions (TODO)');
  }
  
  public updateVisualLeaderboard(leaderboard: any[]): void 
  {
    // TODO: Update UI leaderboard from server data
    console.log('RACER-RENDERER: Updating leaderboard (TODO)');
  }
  
  public showLapCompleteEffect(podId: string, lapTime: number): void 
  {
    // TODO: Show lap completion visual effect
    console.log(`RACER-RENDERER: Lap complete for ${podId}: ${lapTime}ms (TODO)`);
  }
  
  // Input handling
  public setupLocalInput(): void 
  {
    if (!this.gameCanvas) 
    {
      return;
    }
    
    console.log('RACER-RENDERER: Setting up local input...');
    
    // Use GameCanvas existing input system for now
    // TODO: Replace with dedicated InputHandler when created
    document.addEventListener('keydown', this.handleLocalInput.bind(this));
    document.addEventListener('keyup', this.handleLocalInput.bind(this));
  }
  
  public handleLocalInput(): void 
  {
    // TODO: Process input and send to server when InputHandler is implemented
    // For now, let GameCanvas handle input directly
    console.log('RACER-RENDERER: Processing local input...');
  }
  
  public sendInputToServer(inputData: any): void 
  {
    // TODO: Send input to backend via WebSocket
    console.log('RACER-RENDERER: Sending input to server (TODO)');
  }
  
  // Visual effects and feedback
  public showCheckpointEffect(checkpointId: string): void 
  {
    // TODO: Implement when RacerCheckpoints is created
    console.log(`RACER-RENDERER: Checkpoint effect for ${checkpointId} (TODO)`);
  }
  
  public showSpeedBoostEffect(podId: string): void 
  {
    // TODO: Implement when RacerZones is created
    console.log(`RACER-RENDERER: Speed boost effect for ${podId} (TODO)`);
  }
  
  public updateProgressBars(): void 
  {
    // TODO: Update race progress UI elements
    console.log('RACER-RENDERER: Updating progress bars (TODO)');
  }
  
  public switchCameraMode(mode: 'racing' | 'free' | 'player'): void 
  {
    if (!this.gameCanvas) 
    {
      return;
    }
    
    console.log(`RACER-RENDERER: Switching to ${mode} camera`);
    this.config.cameraMode = mode;
    this.gameCanvas.switchCameraMode(mode);
  }
  
  // Development and monitoring
  public toggleDebugMode(): void 
  {
    this.config.debugMode = !this.config.debugMode;
    
    if (this.gameCanvas) 
    {
      this.gameCanvas.setDevelopmentMode(this.config.debugMode);
    }
    
    console.log(`RACER-RENDERER: Debug mode: ${this.config.debugMode ? 'ON' : 'OFF'}`);
  }
  
  public getPerformanceInfo(): { fps: number; meshCount: number } 
  {
    if (!this.gameCanvas) 
    {
      return { fps: 0, meshCount: 0 };
    }
    
    return this.gameCanvas.getPerformanceInfo();
  }
  
  public startPerformanceMonitoring(): void 
  {
    console.log('RACER-RENDERER: Starting performance monitoring...');
    this.config.performanceMonitoring = true;
    
    // Start update loop for UI performance data
    setInterval(() => 
    {
      if (this.racerUIManager && this.gameCanvas) 
      {
        const perfInfo = this.gameCanvas.getPerformanceInfo();
        // TODO: Add method to update performance in RaceUIManager
        // this.raceUIManager.updatePerformanceInfo(perfInfo.fps, perfInfo.meshCount);
      }
    }, 1000);
  }
  
  // Asset loading
  private async loadVisualAssets(): Promise<void> 
  {
    console.log('RACER-RENDERER: Loading visual assets...');
    
    // TODO: Load visual track components when files are created
    // this.racerTrack = new RacerTrack(this.gameCanvas!.getScene()!);
    // this.checkpoints = new RacerCheckpoints(this.gameCanvas!.getScene()!);
    // this.zones = new RacerZones(this.gameCanvas!.getScene()!);
  }
  
    private async setupLocalPhysics(): Promise<void> 
    {
    if (!this.gameCanvas || !this.racerScene) 
    {
        console.error('RACER-RENDERER: Missing dependencies for physics setup');
        return;
    }
    
    console.log('RACER-RENDERER: Setting up local physics...');
    
    // Single call - RacerPhysics handles everything
    const trackMesh = this.racerScene.getTrack();
    if (trackMesh) 
    {
        const physics = this.gameCanvas.getPhysics();
        if (physics && physics.isPhysicsReady()) 
        {
        await physics.setupTrackCollision(trackMesh, true);
        console.log('RACER-RENDERER: Physics setup complete');
        }
        else 
        {
        console.error('RACER-RENDERER: Physics not ready');
        }
    }
    else 
    {
        console.error('RACER-RENDERER: No track mesh available');
    }
}
  
  private async initializeVisualTrack(): Promise<void> 
  {
    if (!this.gameCanvas) 
    {
      return;
    }
    
    console.log('RACER-RENDERER: Initializing visual track...');
    
    this.updateLoadingProgress('Loading racing track...', 30, 'track');
    
    this.racerScene = new RacerScene(this.gameCanvas);
    
    // Setup progress callback
    this.racerScene.onLoadingProgress = (percentage, asset) => 
    {
      this.updateLoadingProgress(`Loading ${asset}...`, 30 + (percentage * 0.4), 'track');
    };
    
    // Setup track loaded callback
    this.racerScene.onTrackLoaded = (track) => 
    {
      console.log('RACER-RENDERER: Track loaded successfully');
      
      if (this.gameCanvas) 
      {
        this.gameCanvas.setTrackBounds(this.racerScene!.getTrackBounds());
      }
      
      if (this.onTrackLoaded) 
      {
        this.onTrackLoaded(track);
      }
    };
    
    await this.racerScene.loadTrack();
  }
  
  private async setupWebSocketConnection(): Promise<void> 
  {
    // TODO: Implement when RaceWebSocketClient is created
    console.log('RACER-RENDERER: WebSocket connection setup (TODO)');
    // this.webSocketClient = new RaceWebSocketClient();
    // await this.webSocketClient.connect();
  }
  
  private async loadPlayerPod(selectedPod: PodConfig): Promise<void> 
  {
    if (!this.gameCanvas || !this.racerScene) 
    {
      throw new Error('Missing dependencies for pod loading');
    }
    
    console.log(`RACER-RENDERER: Loading player pod: ${selectedPod.name}`);
    
    this.updateLoadingProgress(`Loading ${selectedPod.name}...`, 70, 'pod');
    
    try 
    {
      // Dispose existing pod if any
      if (this.playerPod) 
      {
        this.playerPod.dispose();
        this.playerPod = null;
      }
      
      // Create new pod
      this.playerPod = new RacerPod(this.gameCanvas.getScene()!, selectedPod);
      
      // Setup pod loaded callback
      this.playerPod.onLoaded = (pod) => 
      {
        console.log('RACER-RENDERER: Player pod loaded successfully');
        
        // Position pod at start
        const startPos = this.racerScene!.getStartingPositions(1)[0];
        if (startPos) 
        {
          pod.setPosition(startPos);
        }
        
        // Connect to physics
        this.gameCanvas!.setPlayerPod(pod);
        this.gameCanvas!.enablePlayerMode();
        
        if (this.onPodLoaded) 
        {
          this.onPodLoaded(pod);
        }
      };
      
      this.playerPod.onLoadingError = (error) => 
      {
        console.error('RACER-RENDERER: Pod loading error:', error);
        if (this.onError) 
        {
          this.onError(`Failed to load pod: ${error}`);
        }
      };
      
      await this.playerPod.loadModel();
      
    } 
    catch (error) 
    {
      console.error('RACER-RENDERER: Pod loading failed:', error);
      throw error;
    }
  }
  
  // ====================================================
  // LOADING SYSTEM
  // ====================================================
  
  private createLoadingOverlay(): void 
  {
    const loadingHTML = `
      <div id="racerLoadingOverlay" class="fixed inset-0 bg-black/90 flex items-center justify-center" style="z-index: 2000;">
        <!-- Particle Canvas -->
        <canvas id="racerParticleCanvas" class="absolute inset-0 w-full h-full"></canvas>
        
        <!-- Loading Content -->
        <div class="relative z-10 text-center">
          <!-- Circular Progress Bar -->
          <div class="relative w-32 h-32 mx-auto mb-8">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <!-- Background Circle -->
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="rgb(75 85 99)" 
                stroke-width="4"
              />
              <!-- Progress Circle -->
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
            <!-- Percentage Text -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span id="racerProgressPercent" class="text-white text-xl font-bold">0%</span>
            </div>
          </div>

          <h3 class="text-white text-2xl font-bold mb-4">Loading Race</h3>
          <p class="text-gray-300 text-lg" id="racerLoadingMessage">Preparing 3D scene...</p>
          
          <!-- Loading Stage Indicator -->
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
    
    // Show retry button after 2 seconds
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
    // Update loading message
    const messageElement = document.getElementById('racerLoadingMessage');
    if (messageElement) 
    {
      messageElement.textContent = message;
    }

    // Update progress circle
    const progressCircle = document.getElementById('racerProgressCircle');
    const progressPercent = document.getElementById('racerProgressPercent');
    
    if (progressCircle && progressPercent) 
    {
      const circumference = 314;
      const offset = circumference - (progress / 100) * circumference;
      progressCircle.style.strokeDashoffset = offset.toString();
      progressPercent.textContent = `${Math.round(progress)}%`;
    }

    // Update stage indicator
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

    console.log(`RACER-RENDERER: ${message} (${progress}%)`);
    
    // Also call the callback if it exists (for compatibility)
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

    // Create particles
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

    // Animation loop
    const animate = () => 
    {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => 
      {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) 
        {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) 
        {
          particle.vy *= -1;
        }

        // Draw particle
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Continue animation if loading is active
      if (this.isLoadingActive) 
      {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }
  
  // Force cleanup loading (called on errors or disposal)
  private forceCleanupLoading(): void 
  {
    console.log('RACER-RENDERER: Force cleaning up loading overlay...');
    
    this.isLoadingActive = false;
    
    if (this.loadingOverlay) 
    {
      this.loadingOverlay.remove();
      this.loadingOverlay = null;
    }
    
    // Also clean up any orphaned loading elements
    const orphanedOverlay = document.getElementById('racerLoadingOverlay');
    if (orphanedOverlay) 
    {
      orphanedOverlay.remove();
    }
  }
  
  // Public method to force cleanup (can be called from outside)
  public forceCleanup(): void 
  {
    console.log('RACER-RENDERER: Force cleanup requested...');
    
    this.forceCleanupLoading();
    this.stopVisualRace();
    
    // Also dispose everything
    this.dispose();
  }
  
  // Getters
  public getGameCanvas(): GameCanvas | null 
  {
    return this.gameCanvas;
  }
  
  public getWebSocketClient(): any | null 
  {
    // TODO: Return RaceWebSocketClient when implemented
    return null; // this.webSocketClient;
  }
  
  public getCurrentCameraMode(): string | undefined 
  {
    return this.gameCanvas?.getCurrentCameraMode();
  }
  
  public isReady(): boolean 
  {
    return this.isInitialized && this.gameCanvas !== null && this.playerPod !== null;
  }
  
  // Cleanup
  public dispose(): void 
  {
    console.log('RACER-RENDERER: Disposing...');
    
    this.stopVisualRace();
    
    // Clean up loading overlay first
    this.isLoadingActive = false;
    if (this.loadingOverlay) 
    {
      this.loadingOverlay.remove();
      this.loadingOverlay = null;
    }
    
    // Dispose pods
    if (this.playerPod) 
    {
      this.playerPod.dispose();
      this.playerPod = null;
    }
    
    this.otherPlayerPods.forEach(pod => pod.dispose());
    this.otherPlayerPods.clear();
    
    // Dispose visual systems
    // TODO: Dispose when files are created
    // this.racerTrack?.dispose();
    // this.checkpoints?.dispose();
    // this.zones?.dispose();
    // this.inputHandler?.dispose();
    // this.webSocketClient?.dispose();
    
    // Dispose UI Manager
    if (this.racerUIManager) 
    {
      this.racerUIManager.dispose();
      this.racerUIManager = null;
    }
    
    // Dispose scene and canvas
    if (this.racerScene) 
    {
      this.racerScene.dispose();
      this.racerScene = null;
    }

    if (this.gameCanvas) 
    {
      this.gameCanvas.dispose();
      this.gameCanvas = null;
    }

    this.isInitialized = false;
  }
}