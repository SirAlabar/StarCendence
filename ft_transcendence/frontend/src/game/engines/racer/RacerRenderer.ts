import { GameCanvas } from './GameCanvas';
import { RacerScene } from './RacerScene';
import { RacerPod } from './RacerPods';
import { RacerUIManager } from '../../managers/RacerUIManager';
import { PodConfig, AVAILABLE_PODS } from '../../utils/PodConfig';
import { RaceManager } from '../../managers/RaceManager';
import { getBaseUrl } from '@/types/api.types';
import { webSocketService } from '@/services/websocket/WebSocketService';
import { Vector3, Quaternion } from '@babylonjs/core';

export interface RacerRendererConfig 
{
  debugMode?: boolean;
  performanceMonitoring?: boolean;
  cameraMode?: 'racing' | 'free' | 'player';
  gameId?: string | null; // Multiplayer support
}

interface RemotePod 
{
  userId: string;
  pod: RacerPod;
  lastUpdate: number;
}

export class RacerRenderer 
{
  private gameCanvas: GameCanvas | null = null;
  private racerScene: RacerScene | null = null;
  private playerPod: RacerPod | null = null;
  private remotePods: Map<string, RemotePod> = new Map();
  private racerUIManager: RacerUIManager | null = null;
  private loadingOverlay: HTMLElement | null = null;
  private isLoadingActive: boolean = false;
  private config: RacerRendererConfig;
  private isInitialized: boolean = false;
  private hudUpdateInterval: number | null = null;
  private raceManager: RaceManager | null = null;
  private gameId: string | null = null; // Multiplayer support
  
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
    
    // Store gameId for multiplayer
    this.gameId = config?.gameId || null;
    
    if (this.gameId) 
    {
      console.log(`[RacerRenderer] 🌐 Multiplayer mode - gameId: ${this.gameId}`);
      // Setup WebSocket listener for multiplayer state updates
      this.setupMultiplayerListener();
    } 
    else 
    {
      console.log('[RacerRenderer] 🖥️  Single-player mode');
    }
  }
  
  /**
   * ✅ NEW: Setup WebSocket listener for receiving other players' positions
   */
  private setupMultiplayerListener(): void 
  {
    webSocketService.on('game:racer:state', (data: any) => 
    {
      if (data.gameId !== this.gameId) 
      {
        return; // Not for this game
      }
      
      // Update remote players' positions
      this.updateRemotePlayers(data.players);
    });
    
    console.log('[RacerRenderer] 📡 Multiplayer listener setup complete');
  }
  
  /**
   * ✅ NEW: Update remote players from server broadcast
   */
  private updateRemotePlayers(players: any[]): void 
  {
    if (!this.gameCanvas || !this.racerScene) 
    {
      return;
    }
    
    const currentUserId = (window as any).userId; // Get current user's ID
    
    for (const playerData of players) 
    {
      const { playerId, position, rotation } = playerData;
      
      // Skip own player
      if (playerId === currentUserId) 
      {
        continue;
      }
      
      // Get or create remote pod
      let remotePod = this.remotePods.get(playerId);
      
      if (!remotePod) 
      {
        // Create new remote pod
        console.log(`[RacerRenderer] 🎮 Creating remote pod for player ${playerId}`);
        remotePod = this.createRemotePod(playerId);
        
        if (!remotePod) 
        {
          continue;
        }
      }
      
      // Update position with interpolation
      const mesh = remotePod.pod.getMesh();
      if (mesh && position) 
      {
        const targetPos = new Vector3(position.x, position.y, position.z);
        
        // Smooth interpolation (15% per frame)
        mesh.position = Vector3.Lerp(mesh.position, targetPos, 0.15);
        
        // Update rotation if provided
        if (rotation && mesh.rotationQuaternion) 
        {
          const targetRot = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
          mesh.rotationQuaternion = Quaternion.Slerp(mesh.rotationQuaternion, targetRot, 0.15);
        }
        
        remotePod.lastUpdate = Date.now();
      }
    }
  }
  
  /**
   * ✅ NEW: Create a pod for remote player
   */
  private createRemotePod(userId: string): RemotePod | undefined 
  {
    if (!this.gameCanvas || !this.racerScene) 
    {
      return undefined;
    }
    
    const scene = this.gameCanvas.getScene();
    if (!scene) 
    {
      return undefined;
    }
    
    // Use default Anakin pod for all remote players (consistent look)
    const remotePodConfig: PodConfig = {
      ...AVAILABLE_PODS[0], // Anakin's pod
      id: `remote_${userId}`,
      name: `Remote Player ${userId.substring(0, 8)}`
    };
    
    const remotePod = new RacerPod(scene, remotePodConfig);
    
    // Load model asynchronously
    remotePod.loadModel().then(() => 
    {
      console.log(`[RacerRenderer] ✅ Remote pod loaded for ${userId}`);
      
      // Don't enable physics for remote pods (they just follow positions)
    }).catch((error) => 
    {
      console.error(`[RacerRenderer] ❌ Failed to load remote pod for ${userId}:`, error);
    });
    
    const remoteData: RemotePod = 
    {
      userId,
      pod: remotePod,
      lastUpdate: Date.now()
    };
    
    this.remotePods.set(userId, remoteData);
    
    return remoteData;
  }
  
  public async initialize(canvasId: string, selectedPod: PodConfig): Promise<void> 
  {
    const startTime = Date.now();
    
    try 
    {
      this.createLoadingOverlay();
      this.showLoading();
      this.initializeParticles();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.updateLoadingProgress('Creating 3D scene...', 10, 'canvas');
      this.gameCanvas = new GameCanvas(canvasId);
      await this.gameCanvas.initialize();
      
      this.updateLoadingProgress('Setting up camera controls...', 25, 'physics');
      this.gameCanvas.initializeManagers();
      this.gameCanvas.startRenderLoop();
      
      await this.initializeVisualTrack();
      await this.setupLocalPhysics();
      await this.loadPlayerPod(selectedPod);
      
      this.isInitialized = true;
      this.updateLoadingProgress('Racing scene ready!', 95, 'pod');
      
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 5000;
      
      if (elapsedTime < minLoadingTime) 
      {
        const remainingTime = minLoadingTime - elapsedTime;
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      this.updateLoadingProgress('Ready to race!', 100, 'complete');
      
      setTimeout(() => 
      {
        this.hideLoading();
      }, 500);
      
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
    
    try 
    {
      const userAvatarUrl = await this.getUserAvatarUrl();
      const avatarToUse = await this.preloadAvatarImage(userAvatarUrl);

      this.raceManager = new RaceManager();
      (window as any).raceManager = this.raceManager;

      if (this.playerPod) 
      {
        this.raceManager.registerRacer(this.playerPod);
      }

      this.raceManager.startRace();
      
      this.racerUIManager = new RacerUIManager(
      {
        showHUD: true,
        showDebugInfo: this.config.debugMode || false,
        maxSpeed: 600
      });

      if (!this.racerUIManager) 
      {
        throw new Error('Failed to create RacerUIManager');
      }

      this.racerUIManager.setRaceInfo(
        this.raceManager.getTotalLaps(),
        this.raceManager.getTotalRacers()
      );

      (window as any).racerUIManager = this.racerUIManager;
      
      this.racerUIManager.setFinishScreenCallbacks(
        () => this.handleRestartRace(),
        () => this.handleLeaveRace()
      );
      
      (window as any).playerAvatarUrl = avatarToUse;
      
      const inputManager = this.gameCanvas?.['inputManager'];
      if (inputManager) 
      {
        inputManager.setAllowPodMovement(false);
      }
      
      await this.racerUIManager.showCountdown(5);
      
      if (inputManager) 
      {
        inputManager.setAllowPodMovement(true);
        
        // Enable multiplayer mode if gameId exists
        if (this.gameId) 
        {
          inputManager.setMultiplayerMode(this.gameId);
        }
      }
    
      this.racerUIManager.startRace();
      this.startHUDUpdateLoop();
    }
    catch (error) 
    {
      console.error('Failed to start visual race:', error);
      throw error;
    }
  }

  private handleRestartRace(): void 
  {
    if (this.racerUIManager) 
    {
      this.racerUIManager.hideFinishScreen();
      this.racerUIManager.dispose();
      this.racerUIManager = null;
    }

    if (this.hudUpdateInterval) 
    {
      clearInterval(this.hudUpdateInterval);
      this.hudUpdateInterval = null;
    }

    if (this.raceManager) 
    {
      this.raceManager.reset();
    }
    
    if (this.playerPod && this.racerScene) 
    {
      const startPositions = this.racerScene.getStartingPositions(1);
      const startPos = startPositions[0];
      
      this.playerPod.setPosition(startPos);
      this.playerPod.initializeCheckpoints(this.racerScene);
      
      const physics = this.gameCanvas?.getPhysics();
      if (physics) 
      {
        this.playerPod.disablePhysics();
        this.playerPod.enablePhysics(physics, startPos);
      }
    }
    
    this.startVisualRace();
  }

  private handleLeaveRace(): void 
  {
    this.dispose();
    
    window.location.href = '/games';
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
      
      if (this.raceManager && this.playerPod) 
      {
        this.raceManager.updateRacerProgress(this.playerPod.getConfig().id);
      }
    }, 100) as unknown as number;
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
    const speedKmh = Math.round(currentSpeed * 3.6);
    
    this.racerUIManager.updateSpeed(speedKmh);
    
    if (this.raceManager) 
    {
      const position = this.raceManager.calculatePosition(podId);
      this.racerUIManager.updatePosition(position);
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
      const collisionMesh = this.racerScene.findCollisionMesh();
      if (collisionMesh) 
      {
        physics.addCollisionMesh(collisionMesh);
      }
    }

    const trackBounds = this.racerScene.getTrackBounds();
    this.gameCanvas.setTrackBounds(trackBounds);
  }

  private async initializeVisualTrack(): Promise<void> 
  {
    if (!this.gameCanvas) 
    {
      return;
    }
    
    this.updateLoadingProgress('Loading polar pass track...', 35, 'track');
    
    this.racerScene = new RacerScene(this.gameCanvas, 
    {
      trackSize: 1000,
      trackSubdivisions: 50,
      enableFog: true,
    });

    this.racerScene.onLoadingProgress = (percentage: number, asset: string) => 
    {
      const progress = 35 + (percentage * 0.3);
      this.updateLoadingProgress(`Loading track: ${asset}`, progress, 'track');
    };

    this.racerScene.onLoadingComplete = () => 
    {
      this.updateLoadingProgress('Track loaded!', 70, 'track');
      
      if (this.onTrackLoaded && this.racerScene) 
      {
        const track = this.racerScene.getTrack();
        if (track) 
        {
          this.onTrackLoaded(track);
        }
      }
    };

    await this.racerScene.loadTrack();
  }

  private async loadPlayerPod(podConfig: PodConfig): Promise<void> 
  {
    if (!this.gameCanvas || !this.racerScene) 
    {
      return;
    }
    
    const scene = this.gameCanvas.getScene();
    if (!scene) 
    {
      return;
    }

    this.updateLoadingProgress('Loading pod racer...', 75, 'pod');

    this.playerPod = new RacerPod(scene, podConfig);

    this.playerPod.onLoadingProgress = (progress: number) => 
    {
      const adjustedProgress = 75 + (progress * 0.15);
      this.updateLoadingProgress(`Loading pod: ${Math.round(progress)}%`, adjustedProgress, 'pod');
    };

    this.playerPod.onLoaded = (pod) => 
    {
      this.updateLoadingProgress('Pod loaded! Setting up physics...', 90, 'pod');
      
      const startPositions = this.racerScene!.getStartingPositions(1);
      const startPos = startPositions[0];

      if (this.racerScene) 
      {
        pod.initializeCheckpoints(this.racerScene);
      }

      const physics = this.gameCanvas!.getPhysics();
      if (physics) 
      {
        pod.enablePhysics(physics, startPos);
      }

      this.gameCanvas!.setPlayerPod(pod);
      
      if (this.onPodLoaded) 
      {
        this.onPodLoaded(pod);
      }
    };

    await this.playerPod.loadModel();
  }

  private async getUserAvatarUrl(): Promise<string> 
  {
    try 
    {
      const token = localStorage.getItem('access_token');
      
      if (!token) 
      {
        return '/assets/images/default-avatar.jpeg';
      }

      const response = await fetch(`${getBaseUrl()}/users/me`, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) 
      {
        return '/assets/images/default-avatar.jpeg';
      }

      const userData = await response.json();
      return userData.avatarUrl || '/assets/images/default-avatar.jpeg';
    } 
    catch (error) 
    {
      return '/assets/images/default-avatar.jpeg';
    }
  }

  private async preloadAvatarImage(url: string): Promise<string> 
  {
    return new Promise((resolve) => 
    {
      const img = new Image();
      
      img.onload = () => 
      {
        resolve(url);
      };
      
      img.onerror = () => 
      {
        resolve('/assets/images/default-avatar.jpeg');
      };
      
      img.src = url;
    });
  }

  private createLoadingOverlay(): void 
  {
    const overlay = document.createElement('div');
    overlay.id = 'racerLoadingOverlay';
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
    overlay.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%);
      backdrop-filter: blur(10px);
    `;
    
    overlay.innerHTML = `
      <div class="text-center">
        <div class="mb-8">
          <div class="relative w-32 h-32 mx-auto">
            <div class="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
        </div>
        
        <h2 id="loadingTitle" class="text-4xl font-bold mb-4 text-white">
          INITIALIZING POD RACER
        </h2>
        
        <div id="loadingMessage" class="text-cyan-400 text-xl mb-6 h-8">
          Starting engines...
        </div>
        
        <div class="w-96 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div id="loadingBar" class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style="width: 0%"></div>
        </div>
        
        <div id="loadingStage" class="text-gray-500 text-sm mt-4">
          Preparing scene...
        </div>
        
        <canvas id="loadingParticles" class="absolute inset-0 pointer-events-none" style="width: 100%; height: 100%;"></canvas>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  private updateLoadingProgress(message: string, progress: number, stage: string): void 
  {
    const messageEl = document.getElementById('loadingMessage');
    const barEl = document.getElementById('loadingBar');
    const stageEl = document.getElementById('loadingStage');
    
    if (messageEl) 
    {
      messageEl.textContent = message;
    }
    
    if (barEl) 
    {
      barEl.style.width = `${progress}%`;
    }
    
    if (stageEl) 
    {
      const stages = 
      {
        'canvas': 'Scene Setup',
        'physics': 'Physics Engine',
        'track': 'Loading Track',
        'pod': 'Loading Pod',
        'complete': 'Ready!'
      };
      
      stageEl.textContent = stages[stage as keyof typeof stages] || stage;
    }
    
    if (this.onLoadingProgress) 
    {
      this.onLoadingProgress(message, progress, stage);
    }
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
      this.loadingOverlay.style.opacity = '0';
      this.loadingOverlay.style.transition = 'opacity 0.5s ease-out';
      
      setTimeout(() => 
      {
        if (this.loadingOverlay) 
        {
          this.loadingOverlay.remove();
          this.loadingOverlay = null;
        }
        this.isLoadingActive = false;
      }, 500);
    }
  }

  private showLoadingError(message: string): void 
  {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg z-[10000]';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => 
    {
      errorDiv.remove();
    }, 5000);
  }

  private initializeParticles(): void 
  {
    const canvas = document.getElementById('loadingParticles') as HTMLCanvasElement;
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

    interface Particle 
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life?: number;
      maxLife?: number;
      isFighting?: boolean;
      trail?: { x: number; y: number; opacity: number; }[];
    }

    const backgroundParticles: Particle[] = [];
    const fightingParticles: Particle[] = [];

    for (let i = 0; i < 100; i++) 
    {
      backgroundParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    canvas.addEventListener('mousemove', (e) => 
    {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (Math.random() > 0.7)
      {
        fightingParticles.push({
          x: mouseX + (Math.random() - 0.5) * 30,
          y: mouseY + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          size: Math.random() * 4 + 3,
          opacity: 1,
          life: 150,
          maxLife: 150,
          isFighting: true,
          trail: []
        });
      }
    });

    const getDistance = (p1: Particle, p2: Particle): number => 
    {
      return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    };

    const drawConnections = (particles: Particle[], maxDistance: number, color: string) => 
    {
      for (let i = 0; i < particles.length; i++) 
      {
        for (let j = i + 1; j < particles.length; j++) 
        {
          const distance = getDistance(particles[i], particles[j]);
          
          if (distance < maxDistance) 
          {
            const opacity = (1 - distance / maxDistance) * 0.3;
            
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => 
    {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      backgroundParticles.forEach(particle => 
      {
        particle.vx += (Math.random() - 0.5) * 0.02;
        particle.vy += (Math.random() - 0.5) * 0.02;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        particle.y += Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 0.1;

        if (particle.x < -10) 
        {
          particle.x = canvas.width + 10;
        }
        if (particle.x > canvas.width + 10) 
        {
          particle.x = -10;
        }
        if (particle.y < -10) 
        {
          particle.y = canvas.height + 10;
        }
        if (particle.y > canvas.height + 10) 
        {
          particle.y = -10;
        }
        
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      });

      for (let i = fightingParticles.length - 1; i >= 0; i--) 
      {
        const particle = fightingParticles[i];
        
        particle.trail!.unshift({
          x: particle.x,
          y: particle.y,
          opacity: particle.opacity
        });
        
        if (particle.trail!.length > 15) 
        {
          particle.trail!.pop();
        }
        
        particle.trail!.forEach((point, index) => 
        {
          point.opacity = (particle.opacity * (1 - index / particle.trail!.length)) * 0.8;
        });
        
        particle.vx += (Math.random() - 0.5) * 0.8;
        particle.vy += (Math.random() - 0.5) * 0.8;
        
        const maxSpeed = 5;
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) 
        {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }
        
        particle.vx *= 0.96;
        particle.vy *= 0.96;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        particle.life!--;
        particle.opacity = particle.life! / particle.maxLife!;

        if (particle.life! <= 0) 
        {
          fightingParticles.splice(i, 1);
        }
      }

      drawConnections(backgroundParticles, 120, 'rgba(168, 85, 247, 0.3)');

      drawConnections(fightingParticles, 80, 'rgba(99, 234, 254, 0.6)');

      backgroundParticles.forEach(particle => 
      {
        const time = Date.now() * 0.002;
        const pulseEffect = 0.5 + 0.5 * Math.sin(time + particle.x * 0.01 + particle.y * 0.01);
        const currentOpacity = particle.opacity * (0.6 + 0.4 * pulseEffect);
        
        ctx.globalAlpha = currentOpacity;
        
        const glowSize = particle.size * (2 + pulseEffect);
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowSize
        );
        gradient.addColorStop(0, `rgba(168, 85, 247, ${currentOpacity})`);
        gradient.addColorStop(0.4, `rgba(168, 85, 247, ${currentOpacity * 0.6})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        const coreSize = particle.size * (0.8 + 0.2 * pulseEffect);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, coreSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      fightingParticles.forEach(particle => 
      {
        particle.trail!.forEach((point, index) => 
        {
          if (point.opacity > 0.05) 
          {
            ctx.globalAlpha = point.opacity;
            
            const trailSize = particle.size * (1 - index / particle.trail!.length) * 0.8;
            
            const trailGradient = ctx.createRadialGradient(
              point.x, point.y, 0,
              point.x, point.y, trailSize * 2
            );
            trailGradient.addColorStop(0, '#63eafe');
            trailGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#63eafe';
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.globalAlpha = particle.opacity;
        
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, '#63eafe');
        gradient.addColorStop(0.3, '#9333ea');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#63eafe';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      if (this.isLoadingActive) 
      {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

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
    
    // 👈 NEW: Dispose remote pods
    this.remotePods.forEach((remotePod) => 
    {
      remotePod.pod.dispose();
    });
    this.remotePods.clear();
    
    // Remove multiplayer listener
    if (this.gameId) 
    {
      webSocketService.off('game:racer:state', () => {});
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
      this.gameCanvas.dispose();
      this.gameCanvas = null;
    }

    if (this.raceManager) 
    {
      this.raceManager.dispose();
      this.raceManager = null;
    }

    this.isInitialized = false;
  }
}