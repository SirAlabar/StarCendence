import { GameCanvas } from './GameCanvas';
import { RacerScene } from './RacerScene';
import { RacerPod } from './RacerPods';
import { RacerUIManager } from '../../managers/RacerUIManager';
import { PodConfig } from '../../utils/PodConfig';
import { RaceManager } from '../../managers/RaceManager';

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
  private raceManager: RaceManager | null = null;
  
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
    
    // Get user avatar
    const userAvatarUrl = this.getUserAvatarUrl();
    const avatarToUse = await this.preloadAvatarImage(userAvatarUrl);

    this.raceManager = new RaceManager();
    (window as any).raceManager = this.raceManager;

    // Register player
    if (this.playerPod) 
    {
      this.raceManager.registerRacer(this.playerPod);
    }

    // Start race
    this.raceManager.startRace();
    
    this.racerUIManager = new RacerUIManager(
    {
      showHUD: true,
      showDebugInfo: this.config.debugMode || false,
      maxSpeed: 600,
      totalLaps: this.raceManager.getTotalLaps(),
      totalRacers: this.raceManager.getTotalRacers()
    });

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
    }
 
    this.racerUIManager.startRace();
    this.startHUDUpdateLoop();
  }

  private handleRestartRace(): void 
  {
    // Hide finish screen
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
    
    // Reset player pod
    if (this.playerPod && this.racerScene) 
    {
      const startPositions = this.racerScene.getStartingPositions(1);
      const startPos = startPositions[0];
      
      this.playerPod.setPosition(startPos);
      this.playerPod.initializeCheckpoints(this.racerScene);
      
      // Re-enable physics
      const physics = this.gameCanvas?.getPhysics();
      if (physics) 
      {
        this.playerPod.disablePhysics();
        this.playerPod.enablePhysics(physics, startPos);
      }
    }
    
    // Restart the race
    this.startVisualRace();
  }

  private handleLeaveRace(): void 
  {
    this.dispose();
    
    // Navigate back
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
      
      // Update race manager
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

  private preloadAvatarImage(userAvatarUrl?: string): Promise<string> 
  {
    return new Promise((resolve) => 
    {
      const defaultAvatar = '/assets/images/default-avatar.jpeg';
      
      // If no user avatar provided, use default
      if (!userAvatarUrl) 
      {
        const img = new Image();
        img.src = defaultAvatar;
        resolve(defaultAvatar);
        return;
      }
      
      // Try loading user avatar
      const img = new Image();
      img.onload = () => 
      {
        resolve(userAvatarUrl); // Success, use user's avatar
      };
      img.onerror = () => 
      {
        const fallbackImg = new Image();
        fallbackImg.src = defaultAvatar;
        resolve(defaultAvatar); // Fallback to default
      };
      img.src = userAvatarUrl;
    });
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
    <div id="racerLoadingOverlay" class="fixed inset-0 bg-black/95 flex items-center justify-center" style="z-index: 2000;">
      <canvas id="racerParticleCanvas" class="absolute inset-0 w-full h-full"></canvas>
      
      <div class="relative z-10 text-center">
        <!-- Progress Circle (bigger box) -->
        <div class="relative w-40 h-40 mx-auto mb-8">
          <svg class="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
            <!-- Background Circle -->
            <circle 
              cx="80" 
              cy="80" 
              r="60" 
              fill="none" 
              stroke="rgba(75, 85, 99, 0.3)" 
              stroke-width="4"
            />
            <!-- Progress Circle -->
            <circle 
              id="racerProgressCircle"
              cx="80" 
              cy="80" 
              r="60" 
              fill="none" 
              stroke="url(#progressGradient)" 
              stroke-width="4"
              stroke-linecap="round"
              stroke-dasharray="377"
              stroke-dashoffset="377"
              class="transition-all duration-500 ease-out"
              style="filter: drop-shadow(0 0 8px #a855f7);"
            />
            <!-- Gradient Definition -->
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#63eafe;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#9333ea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
          
          <!-- Percentage Display -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span id="racerProgressPercent" class="text-white text-xl font-bold">0%</span>
          </div>
        </div>

        <!-- Title -->
        <h3 class="text-white text-2xl font-bold mb-4">Loading Race</h3>
        
        <!-- Simple Loading Message -->
        <p class="text-cyan-300 text-lg" id="racerLoadingMessage">
          Fueling Pod...
        </p>
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
      const simpleMessages = [
        'Fueling Pod...',
        'Checking engines...',
        'Loading track data...',
        'Racer positioning...',
        'Systems online...',
        'Ready to race!'
      ];
      
      const messageIndex = Math.floor((progress / 100) * (simpleMessages.length - 1));
      messageElement.textContent = simpleMessages[messageIndex];
    }

    const progressCircle = document.getElementById('racerProgressCircle');
    const progressPercent = document.getElementById('racerProgressPercent');
    
    if (progressCircle && progressPercent) 
    {
      const circumference = 377;
      const offset = circumference - (progress / 100) * circumference;
      
      progressCircle.style.strokeDashoffset = offset.toString();
      progressPercent.textContent = `${Math.round(progress)}%`;
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

    interface Particle 
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
      isFighting: boolean;
      trail: Array<{x: number; y: number; opacity: number}>;
    }

    const backgroundParticles: Particle[] = [];
    const fightingParticles: Particle[] = [];
    
    // Create background particles
    for (let i = 0; i < 30; i++) 
    {
      backgroundParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.6 + 0.4,
        life: 1,
        maxLife: 1,
        isFighting: false,
        trail: []
      });
    }

    // Mouse trail creation
    canvas.addEventListener('mousemove', (e) => 
    {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Create fighting particles at mouse position
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

        // Wrap around screen
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;
        
        // Apply damping to prevent excessive speed
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      });

      // Update fighting particles
      for (let i = fightingParticles.length - 1; i >= 0; i--) 
      {
        const particle = fightingParticles[i];
        
        // Add current position to trail
        particle.trail.unshift({
          x: particle.x,
          y: particle.y,
          opacity: particle.opacity
        });
        
        // Limit trail length
        if (particle.trail.length > 15) 
        {
          particle.trail.pop();
        }
        
        // Update trail opacity
        particle.trail.forEach((point, index) => 
        {
          point.opacity = (particle.opacity * (1 - index / particle.trail.length)) * 0.8;
        });
        
        // Fighting behavior - erratic movement
        particle.vx += (Math.random() - 0.5) * 0.8;
        particle.vy += (Math.random() - 0.5) * 0.8;
        
        // Limit speed
        const maxSpeed = 5;
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) 
        {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }
        
        // Apply friction
        particle.vx *= 0.96;
        particle.vy *= 0.96;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Update life
        particle.life--;
        particle.opacity = particle.life / particle.maxLife;

        // Remove dead particles
        if (particle.life <= 0) 
        {
          fightingParticles.splice(i, 1);
        }
      }

      // Draw connections for background particles
      drawConnections(backgroundParticles, 120, 'rgba(168, 85, 247, 0.3)');

      // Draw connections for fighting particles
      drawConnections(fightingParticles, 80, 'rgba(99, 234, 254, 0.6)');

      // Draw background particles
      backgroundParticles.forEach(particle => 
      {
        // Calculate pulsing effect
        const time = Date.now() * 0.002;
        const pulseEffect = 0.5 + 0.5 * Math.sin(time + particle.x * 0.01 + particle.y * 0.01);
        const currentOpacity = particle.opacity * (0.6 + 0.4 * pulseEffect);
        
        ctx.globalAlpha = currentOpacity;
        
        // Enhanced glow effect with pulsing
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

        // Core particle with pulsing size
        const coreSize = particle.size * (0.8 + 0.2 * pulseEffect);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, coreSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw fighting particles with comet trails
      fightingParticles.forEach(particle => 
      {
        // Draw comet trail
        particle.trail.forEach((point, index) => 
        {
          if (point.opacity > 0.05) 
          {
            ctx.globalAlpha = point.opacity;
            
            const trailSize = particle.size * (1 - index / particle.trail.length) * 0.8;
            
            // Trail glow
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
            
            // Trail core
            ctx.fillStyle = '#63eafe';
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Draw main particle (comet head)
        ctx.globalAlpha = particle.opacity;
        
        // Main glow effect
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

        // Core particle (bright center)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer core
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

  private getUserAvatarUrl(): string | undefined 
  {
    // TODO: Get from user profile/session/localStorage
    // For now, returns undefined (will use default)
    return undefined;
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

    if (this.raceManager) 
    {
      this.raceManager.dispose();
      this.raceManager = null;
    }

    this.isInitialized = false;
  }
}