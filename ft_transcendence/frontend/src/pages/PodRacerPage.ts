import { BaseComponent } from '../components/BaseComponent';
import { GameCanvas } from '../game/engines/racer/GameCanvas';
import { RacerScene } from '../game/engines/racer/RacerScene';
import { PodSelection, PodSelectionEvent } from '../game/engines/racer/PodSelection';
import { RacerPod } from '../game/engines/racer/RacerPods';
import { PodConfig, AVAILABLE_PODS } from '../game/utils/PodConfig';

export default class PodRacerPage extends BaseComponent 
{
    private gameCanvas: GameCanvas | null = null;
    private racerScene: RacerScene | null = null;
    private podSelection: PodSelection | null = null;
    private playerPod: RacerPod | null = null;
    private selectedPodConfig: PodConfig = AVAILABLE_PODS[0];

    render(): string 
    {
        return `
            <div class="h-screen w-full relative">
                <!-- 3D Canvas (Initially Hidden) -->
                <div id="gameCanvasContainer" class="absolute inset-0" style="display: none;">
                    <canvas 
                        id="gameCanvas" 
                        class="w-full h-full block"
                        style="background: linear-gradient(to bottom, #1a1a2e, #16213e);"
                    ></canvas>
                </div>

                <!-- Game UI (Initially Hidden) -->
                <div id="gameUI" class="absolute inset-0 pointer-events-none" style="display: none;">
                    
                    <!-- Top Info -->
                    <div class="absolute top-4 left-4 pointer-events-auto">
                        <div class="bg-black/50 backdrop-blur rounded-lg p-4">
                            <h2 class="text-white font-bold text-lg mb-2">🏎️ Pod Racer</h2>
                            <div class="text-gray-300 text-sm space-y-1">
                                <div id="trackInfo">Track: Polar Pass</div>
                                <div id="podInfo">Pod: ${this.selectedPodConfig.name}</div>
                                <div id="cameraInfo">Camera: Racing</div>
                                <div class="text-xs text-purple-300 mt-2 border-t border-gray-600 pt-2">
                                    <div>F1: Switch Camera</div>
                                    <div>WASD: Move (Free Mode)</div>
                                    <div>Mouse: Look Around</div>
                                    <div>Scroll: Zoom/Speed</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Camera Mode Indicator -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                        <div id="cameraModeIndicator" class="bg-purple-600/80 backdrop-blur text-white px-4 py-2 rounded-lg">
                            <span id="currentCameraMode">Racing Camera</span>
                        </div>
                    </div>
                    <!-- Buttons -->
                    <div class="absolute top-4 right-4 pointer-events-auto space-x-2">
                        <button 
                            id="toggleDevelopmentMode"
                            onclick="podRacerPage.toggleDevelopmentMode()" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Dev Mode: OFF
                        </button>
                        <button 
                            onclick="podRacerPage.resetCamera()" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            Reset Camera
                        </button>
                        <button 
                            onclick="navigateTo('/games')" 
                            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            Back
                        </button>
                    </div>

                    <!-- Performance Info (Bottom Right) -->
                    <div class="absolute bottom-4 right-4 pointer-events-auto">
                        <div class="bg-black/50 backdrop-blur rounded-lg p-3 border border-gray-500/30">
                            <div class="text-gray-300 text-xs space-y-1">
                                <div>FPS: <span id="fpsCounter">60</span></div>
                                <div>Meshes: <span id="meshCounter">0</span></div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Enhanced Loading with Particles -->
                <div 
                    id="loadingOverlay" 
                    class="absolute inset-0 bg-black/90 flex items-center justify-center"
                    style="display: none;"
                >
                    <!-- Particle Canvas -->
                    <canvas id="particleCanvas" class="absolute inset-0 w-full h-full"></canvas>
                    
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
                                    id="progressCircle"
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
                                <span id="progressPercent" class="text-white text-xl font-bold">0%</span>
                            </div>
                        </div>

                        <h3 class="text-white text-2xl font-bold mb-4">Loading Race</h3>
                        <p class="text-gray-300 text-lg" id="loadingMessage">Preparing 3D scene...</p>
                        
                        <!-- Loading Stage Indicator -->
                        <div class="mt-6 flex justify-center space-x-4">
                            <div id="stage-canvas" class="flex items-center text-gray-500">
                                <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                <span class="text-sm">Canvas</span>
                            </div>
                            <div id="stage-physics" class="flex items-center text-gray-500">
                                <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                <span class="text-sm">Physics</span>
                            </div>
                            <div id="stage-track" class="flex items-center text-gray-500">
                                <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                <span class="text-sm">Track</span>
                            </div>
                            <div id="stage-pod" class="flex items-center text-gray-500">
                                <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                <span class="text-sm">Pod</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pod Selection (Shown First) -->
                <div id="podSelectionContainer"></div>
            </div>
        `;
    }

    mount(_containerId?: string): void 
    {
        (window as any).podRacerPage = this;
        this.showPodSelection();
    }

    public showPodSelection(): void 
    {
        if (this.gameCanvas) 
        {
            this.gameCanvas.stopRenderLoop();
        }
        
        if (!this.podSelection) 
        {
            this.podSelection = new PodSelection((event: PodSelectionEvent) => 
            {
                this.onPodSelected(event);
            });
            
            const container = document.getElementById('podSelectionContainer');
            if (container) 
            {
                container.innerHTML = this.podSelection.render();
                this.podSelection.mount();
            }
        }

        if (this.podSelection) 
        {
            this.podSelection.show();
        }
    }

    private onPodSelected(event: PodSelectionEvent): void 
    {
        console.log(`Pod selected: ${event.selectedPod.name}`);
        
        this.selectedPodConfig = event.selectedPod;
        event.onConfirm();
        
        this.initialize3DScene();
    }

    private async initialize3DScene(): Promise<void> 
    {
        try 
        {
            this.showLoading();
            this.initializeParticles();
            
            console.log('Starting 3D scene with selected pod...');
            
            this.updateLoadingProgress('Creating 3D scene...', 10, 'canvas');
            this.gameCanvas = new GameCanvas('gameCanvas');
            
            this.updateLoadingProgress('Initializing physics engine...', 15, 'physics');
            await this.gameCanvas.initialize();
            console.log('Physics initialized');
            
            this.updateLoadingProgress('Setting up camera controls...', 20, 'physics');
            this.gameCanvas.initializeManagers(false);
            
            this.gameCanvas.startRenderLoop();

            this.updateLoadingProgress('Loading racing track...', 30, 'track');
            this.racerScene = new RacerScene(this.gameCanvas);
            
            this.racerScene.onLoadingProgress = (percentage, asset) => 
            {
                this.updateLoadingProgress(`Loading ${asset}...`, 30 + (percentage * 0.4), 'track');
            };

            this.racerScene.onTrackLoaded = (track) => 
            {
                console.log('Racing track loaded:', track.name);
                
                if (this.gameCanvas) 
                {
                    this.gameCanvas.setTrackBounds(this.racerScene!.getTrackBounds());
                }
                
                const trackInfo = document.getElementById('trackInfo');
                if (trackInfo) 
                {
                    const trackBounds = this.racerScene!.getTrackBounds();
                    trackInfo.textContent = `Track: Polar Pass (${Math.round(trackBounds.size.x)}x${Math.round(trackBounds.size.z)}m)`;
                }
            };

            await this.racerScene.loadTrack();
            
            const trackMesh = this.racerScene.getTrack();
            if (trackMesh && this.gameCanvas) 
            {
                this.gameCanvas.setupTrackPhysics(trackMesh);
                console.log('Track physics collision enabled');
            }

            this.updateLoadingProgress(`Loading ${this.selectedPodConfig.name}...`, 70, 'pod');
            await this.loadPod();

            this.updateLoadingProgress('Racing scene ready!', 100, 'pod');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.showGame();
            this.startPerformanceMonitoring();
            this.updateCameraUI();
            
            console.log('3D Pod Racer ready with physics and camera controls!');
            
        } 
        catch (error) 
        {
            console.error('Failed to initialize 3D scene:', error);
            this.showError('Failed to load 3D racing scene');
        }
    }

    private initializeParticles(): void 
    {
        const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement;
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

        const particles: Array<{x: number, y: number, vx: number, vy: number, size: number, opacity: number}> = [];

        for (let i = 0; i < 50; i++) 
        {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                ctx.globalAlpha = particle.opacity;
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            const overlay = document.getElementById('loadingOverlay');
            if (overlay && overlay.style.display !== 'none') 
            {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    private updateLoadingProgress(message: string, progress: number, stage: string): void 
    {
        const messageElement = document.getElementById('loadingMessage');
        if (messageElement) 
        {
            messageElement.textContent = message;
        }

        const progressCircle = document.getElementById('progressCircle');
        const progressPercent = document.getElementById('progressPercent');
        
        if (progressCircle && progressPercent) 
        {
            const circumference = 314;
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset.toString();
            progressPercent.textContent = `${Math.round(progress)}%`;
        }

        const stageElement = document.getElementById(`stage-${stage}`);
        if (stageElement) 
        {
            stageElement.className = 'flex items-center text-purple-400';
            const dot = stageElement.querySelector('.w-3.h-3.rounded-full');
            if (dot) 
            {
                dot.className = 'w-3 h-3 rounded-full bg-purple-400 mr-2 animate-pulse';
            }
        }

        console.log(`${message} (${progress}%)`);
    }

    private async loadPod(): Promise<void> 
    {
        if (!this.gameCanvas || !this.racerScene) 
        {
            console.error('Missing dependencies');
            return;
        }

        try 
        {
            if (this.playerPod) 
            {
                this.playerPod.dispose();
                this.playerPod = null;
            }

            this.playerPod = new RacerPod(this.gameCanvas.getScene()!, this.selectedPodConfig);
            
            this.playerPod.onLoaded = (pod) => 
            {
                console.log(`Pod loaded: ${pod.getConfig().name}`);
                
                const startPos = this.racerScene!.getStartingPositions(1)[0];
                if (startPos) 
                {
                    pod.setPosition(startPos);
                    console.log('Pod positioned at start');
                }

                this.gameCanvas!.setPlayerPod(pod);
                this.gameCanvas!.enablePlayerMode();
                
                console.log('Pod connected with physics enabled!');
            };
            
            this.playerPod.onLoadingError = (error) => 
            {
                console.error('Pod loading error:', error);
            };
            
            await this.playerPod.loadModel();
            
        } 
        catch (error) 
        {
            console.error('Pod loading failed:', error);
        }
    }

    public toggleDevelopmentMode(): void 
    {
        if (!this.gameCanvas)
        {
            return;
        }
        
        const currentMode = this.gameCanvas.getCurrentCameraMode();
        const isDevelopment = currentMode === 'free';
        
        this.gameCanvas.setDevelopmentMode(!isDevelopment);
        this.updateDevelopmentModeUI(!isDevelopment);
        
        console.log(`Development mode: ${!isDevelopment ? 'ON' : 'OFF'}`);
    }

    public resetCamera(): void 
    {
        if (!this.gameCanvas)
        {
            return;
        }
        
        const currentMode = this.gameCanvas.getCurrentCameraMode();
        if (currentMode) 
        {
            this.gameCanvas.switchCameraMode(currentMode);
        }
        console.log('Camera reset to default position');
    }

    private updateDevelopmentModeUI(isDevelopment: boolean): void 
    {
        const toggleButton = document.getElementById('toggleDevelopmentMode');
        if (toggleButton) 
        {
            toggleButton.textContent = `Dev Mode: ${isDevelopment ? 'ON' : 'OFF'}`;
            if (isDevelopment)
            {
                toggleButton.className = 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700';
            }
            else
            {
                toggleButton.className = 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700';
            }
        }
    }

    private updateCameraUI(): void 
    {
        if (!this.gameCanvas)
        {
            return;
        }

        const currentMode = this.gameCanvas.getCurrentCameraMode();
        
        const cameraInfo = document.getElementById('cameraInfo');
        const cameraModeIndicator = document.getElementById('currentCameraMode');
        
        if (currentMode) 
        {
            const modeNames = 
            {
                'racing': 'Racing Camera',
                'free': 'Free Camera', 
                'player': 'Player Camera'
            };
            
            const modeName = modeNames[currentMode] || 'Unknown Camera';
            
            if (cameraInfo) 
            {
                cameraInfo.textContent = `Camera: ${modeName}`;
            }
            
            if (cameraModeIndicator) 
            {
                cameraModeIndicator.textContent = modeName;
            }
        }
        
        const isDevelopment = currentMode === 'free';
        this.updateDevelopmentModeUI(isDevelopment);
    }

    private startPerformanceMonitoring(): void 
    {
        const updatePerformance = () => 
        {
            if (!this.gameCanvas)
            {
                return;
            }
            
            const perfInfo = this.gameCanvas.getPerformanceInfo();
            
            const fpsCounter = document.getElementById('fpsCounter');
            const meshCounter = document.getElementById('meshCounter');
            
            if (fpsCounter) 
            {
                fpsCounter.textContent = Math.round(perfInfo.fps).toString();
            }
            
            if (meshCounter) 
            {
                meshCounter.textContent = perfInfo.meshCount.toString();
            }
        };
        
        setInterval(updatePerformance, 1000);
        updatePerformance();
    }

    private showLoading(): void 
    {
        this.hideElement('podSelectionContainer');
        this.hideElement('gameCanvasContainer'); 
        this.hideElement('gameUI');
        this.showElement('loadingOverlay');
    }

    private showGame(): void 
    {
        this.hideElement('loadingOverlay');
        this.hideElement('podSelectionContainer');
        this.showElement('gameCanvasContainer');
        this.showElement('gameUI');
        
        const podInfo = document.getElementById('podInfo');
        if (podInfo) 
        {
            podInfo.textContent = `Pod: ${this.selectedPodConfig.name}`;
        }
    }

    private showElement(id: string): void 
    {
        const element = document.getElementById(id);
        if (element) 
        {
            if (element.id === 'gameCanvasContainer')
            {
                element.style.display = 'block';
            }
            else
            {
                element.style.display = 'flex';
            }
        }
    }

    private hideElement(id: string): void 
    {
        const element = document.getElementById(id);
        if (element) 
        {
            element.style.display = 'none';
        }
    }

    private showError(message: string): void 
    {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) 
        {
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="text-red-400 text-6xl mb-4">⚠️</div>
                    <h3 class="text-white text-xl font-bold mb-2">Loading Failed</h3>
                    <p class="text-gray-300 mb-4">${message}</p>
                    <button onclick="podRacerPage.showPodSelection()" 
                            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mr-2">
                        Try Different Pod
                    </button>
                    <button onclick="location.reload()" 
                            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    dispose(): void 
    {
        console.log('Disposing PodRacerPage...');
        
        if (this.playerPod) 
        {
            this.playerPod.dispose();
            this.playerPod = null;
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
        
        if (this.podSelection) 
        {
            this.podSelection.dispose();
            this.podSelection = null;
        }
        
        if ((window as any).podRacerPage === this) 
        {
            delete (window as any).podRacerPage;
        }
        
        console.log('PodRacerPage disposed');
    }
}