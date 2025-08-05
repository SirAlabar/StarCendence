import { BaseComponent } from '../components/BaseComponent';
import { GameCanvas } from '../components/game/GameCanvas';

export default class PodRacerPage extends BaseComponent 
{
    private gameCanvas: GameCanvas | null = null;

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
                                <div>Model: Anakin's Pod Racer</div>
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
                            <p class="text-gray-300">Initializing 3D scene...</p>
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
        // Initialize GameCanvas after DOM is ready
        try 
        {
            console.log('Initializing Pod Racer 3D scene...');
            
            // Create GameCanvas instance
            this.gameCanvas = new GameCanvas('gameCanvas');
            
            // Hide loading overlay after scene initialization
            setTimeout(() => 
            {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) 
                {
                    loadingOverlay.style.opacity = '0';
                    loadingOverlay.style.transition = 'opacity 1s ease-out';
                    
                    setTimeout(() => 
                    {
                        loadingOverlay.style.display = 'none';
                    }, 1000);
                }
                
                console.log('Pod Racer scene loaded!');
            }, 3000);

        } 
        catch (error) 
        {
            console.error('Failed to initialize GameCanvas:', error);
            
            // Show error message
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) 
            {
                loadingOverlay.innerHTML = `
                    <div class="text-center">
                        <div class="text-red-400 text-6xl mb-4">⚠️</div>
                        <h3 class="text-white text-xl font-bold mb-2">Loading Failed</h3>
                        <p class="text-gray-300 mb-4">Could not initialize 3D scene</p>
                        <button 
                            onclick="location.reload()" 
                            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    // Cleanup when leaving the page
    dispose(): void 
    {
        if (this.gameCanvas) 
        {
            console.log('Disposing GameCanvas...');
            this.gameCanvas.dispose();
            this.gameCanvas = null;
        }
    }

    // Get GameCanvas instance (for future extensions)
    getGameCanvas(): GameCanvas | null 
    {
        return this.gameCanvas;
    }
}