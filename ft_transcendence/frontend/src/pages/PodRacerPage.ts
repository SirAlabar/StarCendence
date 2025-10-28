import { BaseComponent } from '../components/BaseComponent';
import { PodSelection, PodSelectionEvent } from './PodSelectionPage';
import { RacerRenderer } from '../game/engines/racer/RacerRenderer';
import { PodConfig, AVAILABLE_PODS } from '../game/utils/PodConfig';
import { navigateTo } from '../router/router';

export default class PodRacerPage extends BaseComponent 
{
    private racerRenderer: RacerRenderer | null = null;
    private podSelection: PodSelection | null = null;
    private selectedPodConfig: PodConfig = AVAILABLE_PODS[0];
    private isDisposed: boolean = false;
    
    render(): string 
    {
        return `
            <div class="h-screen w-full relative">
                <!-- 3D Canvas -->
                <canvas 
                    id="gameCanvas" 
                    class="w-full h-full block"
                    style="background: linear-gradient(to bottom, #1a1a2e, #16213e); display: none;"
                ></canvas>

                <!-- Mode Selection Container -->
                <div id="modeSelectionContainer" class="absolute inset-0 flex items-center justify-center">
                    ${this.renderModeSelection()}
                </div>

                <!-- Pod Selection Container -->
                <div id="podSelectionContainer" style="display: none;"></div>
            </div>
        `;
    }

    private renderModeSelection(): string 
    {
        return `
            <div class="w-full max-w-4xl mx-auto px-6">
                <h1 class="text-6xl font-bold mb-16 text-center text-cyan-300 glow-text-cyan">CHOOSE YOUR MODE</h1>
                
                <div class="grid grid-cols-2 gap-8 mb-12">
                    <!-- Training Mode Card -->
                    <div id="trainingCard" class="mode-card rounded-2xl p-12 border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/50">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/training_racer.png" alt="Training" class="w-32 h-32 mb-6 opacity-80">
                            <h3 class="text-3xl font-bold text-blue-400 mb-4">TRAINING</h3>
                            <p class="text-gray-400 text-center mb-8">Practice solo</p>
                            <button class="w-full py-4 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl transition-all">
                                PLAY
                            </button>
                        </div>
                    </div>
                    
                    <!-- Multiplayer Mode Card -->
                    <div id="multiplayerCard" class="mode-card rounded-2xl p-12 border-2 border-orange-500/40 bg-gradient-to-br from-orange-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/50">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/multiplayer_racer.png" alt="Multiplayer" class="w-32 h-32 mb-6 opacity-80">
                            <h3 class="text-3xl font-bold text-orange-400 mb-4">MULTIPLAYER</h3>
                            <p class="text-gray-400 text-center mb-8">Race with others online</p>
                            <button class="w-full py-4 px-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl transition-all">
                                JOIN
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Back Button -->
                <button id="backToGames" class="w-full py-4 px-8 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl transition-all">
                    BACK
                </button>
                
                <style>
                    .glow-text-cyan 
                    {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                </style>
            </div>
        `;
    }

    mount(_containerId?: string): void 
    {
        this.isDisposed = false;
        (window as any).podRacerPage = this;
        this.attachModeSelectionListeners();
        this.setupPageCleanup();
    }

    private attachModeSelectionListeners(): void 
    {
        const trainingCard = document.getElementById('trainingCard');
        const multiplayerCard = document.getElementById('multiplayerCard');
        const backToGames = document.getElementById('backToGames');
        
        if (trainingCard) 
        {
            trainingCard.addEventListener('click', () => this.selectMode('training'));
        }
        
        if (multiplayerCard) 
        {
            multiplayerCard.addEventListener('click', () => this.selectMode('multiplayer'));
        }
        
        if (backToGames) 
        {
            backToGames.addEventListener('click', () => this.goBack());
        }
    }

    private selectMode(mode: 'training' | 'multiplayer'): void 
    {
        if (mode === 'training') 
        {
            // Hide mode selection, show pod selection
            this.showPodSelection();
        }
        else if (mode === 'multiplayer') 
        {
            // Navigate to racer lobby
            navigateTo('/racer-lobby');
        }
    }

    public showPodSelection(): void 
    {
        const modeContainer = document.getElementById('modeSelectionContainer');
        const podContainer = document.getElementById('podSelectionContainer');
        
        if (modeContainer) 
        {
            modeContainer.style.display = 'none';
        }
        
        if (podContainer) 
        {
            podContainer.style.display = 'block';
        }
        
        if (!this.podSelection) 
        {
            this.podSelection = new PodSelection((event: PodSelectionEvent) => 
            {
                this.onPodSelected(event);
            });
            
            if (podContainer) 
            {
                podContainer.innerHTML = this.podSelection.render();
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
        this.selectedPodConfig = event.selectedPod;
        event.onConfirm();
        this.showRaceView();
        this.startRace();
    }

    private showRaceView(): void 
    {
        const podContainer = document.getElementById('podSelectionContainer');
        const gameCanvas = document.getElementById('gameCanvas');
        const backButton = document.getElementById('backButton');
        
        if (podContainer) 
        {
            podContainer.style.display = 'none';
        }
        if (gameCanvas) 
        {
            gameCanvas.style.display = 'block';
        }
        if (backButton) 
        {
            backButton.style.display = 'block';
        }
    }

    private async startRace(): Promise<void>
    {
        try
        {
            if (this.isDisposed)
            {
                return;
            }
            
            if (this.racerRenderer)
            {
                this.racerRenderer.dispose();
                this.racerRenderer = null;
            }
            
            if (this.isDisposed)
            {
                return;
            }
            
            this.racerRenderer = new RacerRenderer(
            {
                debugMode: false,
                performanceMonitoring: true,
                cameraMode: 'racing'
            });
            
            if (!this.racerRenderer)
            {
                throw new Error('Failed to create RacerRenderer');
            }
            
            if (this.isDisposed)
            {
                this.racerRenderer.dispose();
                this.racerRenderer = null;
                return;
            }
            
            await this.racerRenderer.initialize('gameCanvas', this.selectedPodConfig);
            
            if (this.isDisposed)
            {
                if (this.racerRenderer)
                {
                    this.racerRenderer.dispose();
                    this.racerRenderer = null;
                }
                return;
            }
            
            if (!this.racerRenderer)
            {
                throw new Error('RacerRenderer became null after initialization');
            }
            
            await this.racerRenderer.startVisualRace();
            
            if (this.isDisposed)
            {
                if (this.racerRenderer)
                {
                    this.racerRenderer.dispose();
                    this.racerRenderer = null;
                }
                return;
            }
        }
        catch (error)
        {
            console.error('Race start failed:', error);
            
            if (!this.isDisposed)
            {
                alert('Failed to start race. Returning to game selection.');
                this.goBack();
            }
        }
    }
    
    public goBack(): void 
    {
        this.dispose();
        setTimeout(() => 
        {
            navigateTo('/games');
        }, 100);
    }
    
    private setupPageCleanup(): void 
    {
        window.addEventListener('beforeunload', () => 
        {
            this.dispose();
        });
    }
    
    dispose(): void 
    {
        this.isDisposed = true;
        
        if (this.racerRenderer) 
        {
            this.racerRenderer.dispose();
            this.racerRenderer = null;
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