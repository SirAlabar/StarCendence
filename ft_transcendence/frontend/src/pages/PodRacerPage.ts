import { BaseComponent } from '../components/BaseComponent';
import { GameCanvas } from '../components/game/GameCanvas';
import { RacerScene } from '../game/engines/racer/RacerScene';

export default class PodRacerPage extends BaseComponent 
{
    private gameCanvas: GameCanvas | null = null;
    private racerScene: RacerScene | null = null;

    render(): string 
    {
        return `
            <div class="h-screen w-full relative">
                <!-- 3D Game Canvas (Full Screen) -->
                <div id="gameCanvasContainer" class="absolute inset-0">
                    <canvas 
                        id="gameCanvas" 
                        class="w-full h-full block"
                        style="background: linear-gradient(to bottom, #1a1a2e, #16213e);"
                    ></canvas>
                </div>

                <!-- UI Overlay -->
                <div class="absolute inset-0 pointer-events-none">
                    <!-- Top HUD -->
                    <div class="absolute top-4 left-4 pointer-events-auto">
                        <div class="bg-black/50 backdrop-blur rounded-lg p-4 border border-purple-500/30">
                            <h2 class="text-white font-bold text-lg mb-2">🏎️ Pod Racer</h2>
                            <div class="text-gray-300 text-sm space-y-1">
                                <div id="trackInfo">Track: Loading...</div>
                                <div>Mouse: Rotate camera</div>
                                <div>Scroll: Zoom in/out</div>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Buttons (Top Right) -->
                    <div class="absolute top-4 right-4 pointer-events-auto space-x-2">
                        <button 
                            onclick="navigateTo('/games')" 
                            class="bg-purple-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-purple-700/80 transition-colors"
                        >
                            Back to Games
                        </button>
                        <button 
                            onclick="navigateTo('/')" 
                            class="bg-gray-600/80 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-gray-700/80 transition-colors"
                        >
                            Home
                        </button>
                    </div>

                    <!-- Loading Overlay -->
                    <div 
                        id="loadingOverlay" 
                        class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto"
                    >
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
                            <h3 class="text-white text-xl font-bold mb-2">Loading Pod Racer</h3>
                            <p class="text-gray-300" id="loadingMessage">Initializing 3D scene...</p>
                            <div class="mt-4 w-64 bg-gray-700 rounded-full h-2">
                                <div id="loadingProgress" class="bg-purple-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Future: Game Controls Overlay -->
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto opacity-0" id="gameControls">
                        <div class="bg-black/50 backdrop-blur rounded-lg p-4 border border-purple-500/30">
                            <div class="text-white text-sm text-center">
                                Game controls will appear here when racing starts
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    mount(_containerId?: string): void 
    {
        this.initializePodRacerScene();
    }

    private async initializePodRacerScene(): Promise<void> 
    {
        try 
        {
            console.log('🏎️ Initializing Pod Racer scene...');
            
            // Step 1: Create GameCanvas foundation
            this.updateLoadingMessage('Initializing 3D engine...', 10);
            this.gameCanvas = new GameCanvas('gameCanvas');
            this.gameCanvas.startRenderLoop();
            
            console.log('✅ GameCanvas initialized');

            // Step 2: Create RacerScene and load track
            this.updateLoadingMessage('Loading racing track...', 25);
            this.racerScene = new RacerScene(this.gameCanvas);
            
            // Set up loading callbacks
            this.racerScene.onLoadingProgress = (percentage, asset) => {
                this.updateLoadingMessage(`Loading ${asset}...`, 25 + (percentage * 0.7)); // 25% + 70% for track loading
            };

            this.racerScene.onTrackLoaded = (track) => {
                console.log('🏁 Racing track loaded:', track.name);
                
                // Update HUD with track info
                const trackInfo = document.getElementById('trackInfo');
                if (trackInfo) {
                    const trackBounds = this.racerScene!.getTrackBounds();
                    trackInfo.textContent = `Track: Polar Pass (${Math.round(trackBounds.size.x)}x${Math.round(trackBounds.size.z)}m)`;
                }
            };

            this.racerScene.onLoadingComplete = () => {
                this.updateLoadingMessage('Racing scene ready!', 100);
                
                // Hide loading overlay
                setTimeout(() => {
                    this.hideLoadingOverlay();
                }, 1000);
            };

            this.racerScene.onLoadingError = (errors) => {
                console.error('❌ Failed to load racing scene:', errors);
                this.showLoadingError('Failed to load racing track');
            };

            // Step 3: Load the track
            await this.racerScene.loadTrack();

        } 
        catch (error) 
        {
            console.error('❌ Failed to initialize Pod Racer scene:', error);
            this.showLoadingError('Could not initialize 3D scene');
        }
    }

    private updateLoadingMessage(message: string, progress: number): void 
    {
        const loadingMessage = document.getElementById('loadingMessage');
        const loadingProgress = document.getElementById('loadingProgress');
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        if (loadingProgress) {
            loadingProgress.style.width = `${Math.min(progress, 100)}%`;
        }
        
        console.log(`Loading: ${progress.toFixed(1)}% - ${message}`);
    }

    private hideLoadingOverlay(): void 
    {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) 
        {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 1s ease-out';
            
            setTimeout(() => 
            {
                loadingOverlay.style.display = 'none';
                console.log('🏁 Pod Racer scene fully loaded and ready!');
            }, 1000);
        }
    }

    private showLoadingError(message: string): void 
    {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) 
        {
            loadingOverlay.innerHTML = `
                <div class="text-center">
                    <div class="text-red-400 text-6xl mb-4">⚠️</div>
                    <h3 class="text-white text-xl font-bold mb-2">Loading Failed</h3>
                    <p class="text-gray-300 mb-4">${message}</p>
                    <button 
                        onclick="location.reload()" 
                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Cleanup when leaving the page
    dispose(): void 
    {
        console.log('🧹 Disposing Pod Racer page...');
        
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
    }

    // Get instances for future extensions
    getGameCanvas(): GameCanvas | null 
    {
        return this.gameCanvas;
    }

    getRacerScene(): RacerScene | null 
    {
        return this.racerScene;
    }

    // Get track information (for debugging/testing)
    getTrackInfo(): any 
    {
        if (!this.racerScene || !this.racerScene.isTrackLoaded()) {
            return null;
        }

        return {
            isLoaded: this.racerScene.isTrackLoaded(),
            trackBounds: this.racerScene.getTrackBounds(),
            trackCenter: this.racerScene.getTrackCenter(),
            startingPositions: this.racerScene.getStartingPositions(1)
        };
    }
}