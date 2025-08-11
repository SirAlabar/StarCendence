// frontend/src/pages/PodRacerPage.ts
// Fixed Pod Racer Page - Pod selection FIRST, then 3D loading

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

                <!-- Simple UI (Initially Hidden) -->
                <div id="gameUI" class="absolute inset-0 pointer-events-none" style="display: none;">
                    
                    <!-- Top Info -->
                    <div class="absolute top-4 left-4 pointer-events-auto">
                        <div class="bg-black/50 backdrop-blur rounded-lg p-4">
                            <h2 class="text-white font-bold text-lg mb-2">🏎️ Pod Racer</h2>
                            <div class="text-gray-300 text-sm">
                                <div id="trackInfo">Track: Polar Pass</div>
                                <div id="podInfo">Pod: ${this.selectedPodConfig.name}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Buttons -->
                    <div class="absolute top-4 right-4 pointer-events-auto space-x-2">
                        <button 
                            onclick="podRacerPage.showPodSelection()" 
                            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                            Change Pod
                        </button>
                        <button 
                            onclick="navigateTo('/games')" 
                            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            Back
                        </button>
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
            this.updateLoadingMessage('Creating 3D scene...');
            this.gameCanvas = new GameCanvas('gameCanvas');
            this.gameCanvas.startRenderLoop();

            // Step 2: Load track
            this.updateLoadingMessage('Loading racing track...');
            this.racerScene = new RacerScene(this.gameCanvas);
            await this.racerScene.loadTrack();

            // Step 3: Load selected pod
            this.updateLoadingMessage(`Loading ${this.selectedPodConfig.name}...`);
            await this.loadPod();

            // Step 4: Show game
            this.showGame();
            
            console.log('✅ 3D Pod Racer ready!');
            
        } 
        catch (error) 
        {
            console.error('❌ Failed to initialize 3D scene:', error);
            this.showError('Failed to load 3D racing scene');
        }
    }

    private async loadPod(): Promise<void> 
    {
        if (!this.gameCanvas || !this.racerScene) 
        {
            return;
        }

        try 
        {
            // Remove old pod if exists
            if (this.playerPod) 
            {
                this.playerPod.dispose();
                this.playerPod = null;
            }

            // Create new pod with selected config
            this.playerPod = new RacerPod(this.gameCanvas.getScene(), this.selectedPodConfig);
            
            // Load the model
            await this.playerPod.loadModel();
            
            // Position at track start
            const startPos = this.racerScene.getStartingPositions(1)[0];
            if (startPos) 
            {
                this.playerPod.setPosition(startPos);
            }

            // Focus camera on pod
            const camera = this.gameCanvas.getCamera();
            if (camera && this.playerPod.getRootNode()) 
            {
                (camera as any).setTarget(this.playerPod.getPosition());
            }

            console.log(`✅ Pod loaded: ${this.selectedPodConfig.name}`);
            
        } 
        catch (error) 
        {
            console.error('❌ Pod loading failed:', error);
        }
    }

    // UI State Management
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
            element.style.display = element.id === 'gameCanvasContainer' ? 'block' : 'flex';
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

    private updateLoadingMessage(message: string): void 
    {
        const element = document.getElementById('loadingMessage');
        if (element) 
        {
            element.textContent = message;
        }
        console.log(`🔄 ${message}`);
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

    // Cleanup
    dispose(): void 
    {
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
    }
}