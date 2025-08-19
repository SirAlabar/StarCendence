
import { BaseComponent } from '../components/BaseComponent';
import { GameCanvas } from '../components/game/GameCanvas';
import { RacerScene } from '../game/engines/racer/RacerScene';
import { PodSelection, PodSelectionEvent } from '../game/engines/racer/PodSelection';
import { RacerPod } from '../game/engines/racer/RacerPods';
import { PodConfig, DEFAULT_POD } from '../game/utils/PodConfig';

export default class PodRacerPage extends BaseComponent 
{
    private gameCanvas: GameCanvas | null = null;
    private racerScene: RacerScene | null = null;
    private podSelection: PodSelection | null = null;
    private playerPod: RacerPod | null = null;
    private selectedPodConfig: PodConfig = DEFAULT_POD;

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

                <!-- Loading (Initially Hidden) -->
                <div 
                    id="loadingOverlay" 
                    class="absolute inset-0 bg-black/80 flex items-center justify-center"
                    style="display: none;"
                >
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
                        <h3 class="text-white text-xl font-bold mb-2">Loading Race</h3>
                        <p class="text-gray-300" id="loadingMessage">Preparing 3D scene...</p>
                        <div class="mt-4 w-64 bg-gray-700 rounded-full h-2">
                            <div id="loadingProgress" class="bg-purple-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
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
        
        // STEP 1: Show pod selection immediately (no 3D loading yet)
        this.showPodSelection();
    }

    public showPodSelection(): void 
    {
        // If 3D scene is running, pause it
        if (this.gameCanvas) 
        {
            this.gameCanvas.stopRenderLoop();
        }
        
        // Create pod selection if not exists
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

        // Show pod selection
        if (this.podSelection) 
        {
            this.podSelection.show();
        }
    }

    private onPodSelected(event: PodSelectionEvent): void 
    {
        console.log(`🏎️ Pod selected: ${event.selectedPod.name}`);
        
        // Save selected pod
        this.selectedPodConfig = event.selectedPod;
        
        // Hide selection UI
        event.onConfirm();
        
        // STEP 2: Now start 3D initialization with chosen pod
        this.initialize3DScene();
    }

    private async initialize3DScene(): Promise<void> 
    {
        try 
        {
            // Show loading
            this.showLoading();
            
            console.log('🎮 Starting 3D scene with selected pod...');
            
            // Step 1: Create canvas
            this.updateLoadingMessage('Creating 3D scene...', 10);
            this.gameCanvas = new GameCanvas('gameCanvas');
            
            // Step 2: Initialize camera and input managers (NEW!)
            this.updateLoadingMessage('Setting up camera controls...', 20);
            this.gameCanvas.initializeManagers(false); // Start in racing mode
            
            // Step 3: Start render loop
            this.gameCanvas.startRenderLoop();

            // Step 4: Load track
            this.updateLoadingMessage('Loading racing track...', 30);
            this.racerScene = new RacerScene(this.gameCanvas);
            
            // Set up loading callbacks for track
            this.racerScene.onLoadingProgress = (percentage, asset) => 
            {
                this.updateLoadingMessage(`Loading ${asset}...`, 30 + (percentage * 0.4)); // 30% + 40% for track
            };

            this.racerScene.onTrackLoaded = (track) => 
            {
                console.log('🏁 Racing track loaded:', track.name);
                
                // Set track bounds for camera system (NEW!)
                if (this.gameCanvas) 
                {
                    this.gameCanvas.setTrackBounds(this.racerScene!.getTrackBounds());
                }
                
                // Update track info
                const trackInfo = document.getElementById('trackInfo');
                if (trackInfo) 
                {
                    const trackBounds = this.racerScene!.getTrackBounds();
                    trackInfo.textContent = `Track: Polar Pass (${Math.round(trackBounds.size.x)}x${Math.round(trackBounds.size.z)}m)`;
                }
            };

            await this.racerScene.loadTrack();

            // Step 5: Load selected pod
            this.updateLoadingMessage(`Loading ${this.selectedPodConfig.name}...`, 70);
            await this.loadPod();

            // Step 6: Show game
            this.updateLoadingMessage('Racing scene ready!', 100);
            this.showGame();
            
            // Step 7: Start additional features (NEW!)
            this.startPerformanceMonitoring();
            this.updateCameraUI();
            
            console.log('✅ 3D Pod Racer ready with camera controls!');
            
        } 
        catch (error) 
        {
            console.error('❌ Failed to initialize 3D scene:', error);
            this.showError('Failed to load 3D racing scene');
        }
    }

    // private async loadPod(): Promise<void> 
    // {
    //     if (!this.gameCanvas || !this.racerScene) 
    //     {
    //         return;
    //     }

    //     try 
    //     {
    //         // Remove old pod if exists
    //         if (this.playerPod) 
    //         {
    //             this.playerPod.dispose();
    //             this.playerPod = null;
    //         }

    //         // Create new pod with selected config
    //         this.playerPod = new RacerPod(this.gameCanvas.getScene()!, this.selectedPodConfig);
            
    //         // Set up the onLoaded callback loading
    //         this.playerPod.onLoaded = (pod) => {
    //             console.log(`🏁 Pod loaded callback: ${pod.getConfig().name}`);
                
    //             // Position at track start
    //             const startPos = this.racerScene!.getStartingPositions(1)[0];
    //             if (startPos) 
    //             {
    //                 pod.setPosition(startPos);
    //                 console.log(`🏁 Pod positioned at: ${startPos.toString()}`);
    //             }

    //             // connect to GameCanvas
    //             this.gameCanvas!.setPlayerPod(pod);
    //             this.gameCanvas!.enablePlayerMode();
                
    //             console.log(`✅ Pod connected and player mode enabled!`);
    //         };
            
    //         // Load the model
    //         await this.playerPod.loadModel();
            
    //     } 
    //     catch (error) 
    //     {
    //         console.error('❌ Pod loading failed:', error);
    //     }
    // }
    // Enhanced loadPod() method with detailed debugging
private async loadPod(): Promise<void> 
{
    console.log('🔍 DEBUG: Starting loadPod() method');
    
    if (!this.gameCanvas || !this.racerScene) 
    {
        console.error('🔍 DEBUG: Missing dependencies - gameCanvas:', !!this.gameCanvas, 'racerScene:', !!this.racerScene);
        return;
    }

    try 
    {
        // Remove old pod if exists
        if (this.playerPod) 
        {
            console.log('🔍 DEBUG: Disposing existing pod');
            this.playerPod.dispose();
            this.playerPod = null;
        }

        console.log('🔍 DEBUG: Creating new pod with config:', this.selectedPodConfig.name);
        
        // Create new pod with selected config
        this.playerPod = new RacerPod(this.gameCanvas.getScene()!, this.selectedPodConfig);
        
        console.log('🔍 DEBUG: Pod instance created:', !!this.playerPod);
        
        // Set up the onLoaded callback BEFORE loading
        this.playerPod.onLoaded = (pod) => {
            console.log('🔍 DEBUG: Pod onLoaded callback triggered');
            console.log('🔍 DEBUG: Pod ready state:', pod.isReady());
            console.log('🔍 DEBUG: Pod root node:', !!pod.getRootNode());
            
            // Position at track start
            const startPos = this.racerScene!.getStartingPositions(1)[0];
            console.log('🔍 DEBUG: Starting position:', startPos);
            
            if (startPos) 
            {
                pod.setPosition(startPos);
                console.log('🔍 DEBUG: Pod positioned at:', pod.getPosition());
            }

            // Debug GameCanvas state
            console.log('🔍 DEBUG: GameCanvas state check:');
            console.log('  - GameCanvas exists:', !!this.gameCanvas);
            console.log('  - Current camera mode:', this.gameCanvas?.getCurrentCameraMode());
            console.log('  - Active camera:', !!this.gameCanvas?.getActiveCamera());
            console.log('  - Scene exists:', !!this.gameCanvas?.getScene());

            // Check CameraManager state
            const cameraManager = (this.gameCanvas as any).cameraManager;
            console.log('🔍 DEBUG: CameraManager state:');
            console.log('  - CameraManager exists:', !!cameraManager);
            if (cameraManager) {
                console.log('  - Current mode:', cameraManager.getCurrentMode());
                console.log('  - Available modes:', cameraManager.getAvailableModes());
            }

            // NOW connect to GameCanvas AFTER everything is ready
            console.log('🔍 DEBUG: Connecting pod to GameCanvas...');
            
            try {
                this.gameCanvas!.setPlayerPod(pod);
                console.log('🔍 DEBUG: setPlayerPod() completed successfully');
                
                // Check if pod was set
                const playerPod = this.gameCanvas!.getPlayerPod();
                console.log('🔍 DEBUG: GameCanvas player pod after set:', !!playerPod);
                console.log('🔍 DEBUG: Pod config name:', playerPod?.getConfig().name);
                
                this.gameCanvas!.enablePlayerMode();
                console.log('🔍 DEBUG: enablePlayerMode() completed successfully');
                
                // Final state check
                console.log('🔍 DEBUG: Final camera mode:', this.gameCanvas?.getCurrentCameraMode());
                
                console.log('✅ Pod connected and player mode enabled!');
                
            } catch (error) {
                console.error('🔍 DEBUG: Error during pod connection:', error);
            }
        };
        
        this.playerPod.onLoadingError = (error) => {
            console.error('🔍 DEBUG: Pod loading error:', error);
        };
        
        console.log('🔍 DEBUG: Starting pod model loading...');
        
        // Load the model (this will trigger onLoaded when complete)
        await this.playerPod.loadModel();
        
        console.log('🔍 DEBUG: loadModel() completed (but onLoaded callback may still be pending)');
        
    } 
    catch (error) 
    {
        console.error('🔍 DEBUG: Exception in loadPod():', error);
    }
}

    // Also add this debugging method to your PodRacerPage class:
    public debugGameState(): void 
    {
        console.log('🔍 DEBUG: Complete Game State:');
        console.log('  - this.gameCanvas:', !!this.gameCanvas);
        console.log('  - this.racerScene:', !!this.racerScene);
        console.log('  - this.playerPod:', !!this.playerPod);
        console.log('  - this.selectedPodConfig:', this.selectedPodConfig.name);
        
        if (this.gameCanvas) {
            console.log('  - GameCanvas player pod:', !!this.gameCanvas.getPlayerPod());
            console.log('  - GameCanvas camera mode:', this.gameCanvas.getCurrentCameraMode());
            console.log('  - GameCanvas active camera:', !!this.gameCanvas.getActiveCamera());
        }
        
        if (this.playerPod) {
            console.log('  - Player pod ready:', this.playerPod.isReady());
            console.log('  - Player pod position:', this.playerPod.getPosition());
            console.log('  - Player pod root node:', !!this.playerPod.getRootNode());
        }
    }


    // ===== NEW CAMERA MANAGEMENT METHODS =====

    public toggleDevelopmentMode(): void 
    {
        if (!this.gameCanvas)
        {
            return;
        }
        
        // Get current development state and toggle it
        const currentMode = this.gameCanvas.getCurrentCameraMode();
        const isDevelopment = currentMode === 'free';
        
        this.gameCanvas.setDevelopmentMode(!isDevelopment);
        this.updateDevelopmentModeUI(!isDevelopment);
        
        console.log(`🎮 Development mode: ${!isDevelopment ? 'ON' : 'OFF'}`);
    }

    public resetCamera(): void 
    {
        if (!this.gameCanvas)
        {
            return;
        }
        
        // Get current camera mode and reset it
        const currentMode = this.gameCanvas.getCurrentCameraMode();
        if (currentMode) 
        {
            this.gameCanvas.switchCameraMode(currentMode);
        }
        console.log('📹 Camera reset to default position');
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
        
        // Update camera info
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
        
        // Update development mode UI
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
        
        // Update performance info every second
        setInterval(updatePerformance, 1000);
        updatePerformance(); // Initial update
    }

    // ===== ORIGINAL UI STATE MANAGEMENT (UNCHANGED) =====

    private showLoading(): void 
    {
        // Hide everything
        this.hideElement('podSelectionContainer');
        this.hideElement('gameCanvasContainer'); 
        this.hideElement('gameUI');
        
        // Show loading
        this.showElement('loadingOverlay');
    }

    private showGame(): void 
    {
        // Hide loading and selection
        this.hideElement('loadingOverlay');
        this.hideElement('podSelectionContainer');
        
        // Show game
        this.showElement('gameCanvasContainer');
        this.showElement('gameUI');
        
        // Update UI
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

    private updateLoadingMessage(message: string, progress?: number): void 
    {
        const element = document.getElementById('loadingMessage');
        if (element) 
        {
            element.textContent = message;
        }
        
        if (progress !== undefined) 
        {
            const progressElement = document.getElementById('loadingProgress');
            if (progressElement) 
            {
                progressElement.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
        }
        
        if (progress)
        {
            console.log(`📥 ${message} (${progress}%)`);
        }
        else
        {
            console.log(`📥 ${message}`);
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

    // ===== ORIGINAL CLEANUP (UNCHANGED) =====

    dispose(): void 
    {
        console.log('🗑️ Disposing PodRacerPage...');
        
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
        
        console.log('✅ PodRacerPage disposed');
    }
}