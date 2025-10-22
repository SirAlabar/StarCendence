
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

                <!-- Pod Selection Container -->
                <div id="podSelectionContainer"></div>
            </div>
        `;
    }

    mount(_containerId?: string): void 
    {
        this.isDisposed = false;
        (window as any).podRacerPage = this;
        this.showPodSelection();
        this.setupPageCleanup();
    }

    public showPodSelection(): void 
    {
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
            // Check if already disposed
            if (this.isDisposed)
            {
                return;
            }
            
            // Clean up any existing renderer
            if (this.racerRenderer)
            {
                this.racerRenderer.dispose();
                this.racerRenderer = null;
            }
            
            // Check again after async operation
            if (this.isDisposed)
            {
                return;
            }
            
            // Create fresh renderer
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
            
            // Check before async initialization
            if (this.isDisposed)
            {
                this.racerRenderer.dispose();
                this.racerRenderer = null;
                return;
            }
            
            // Initialize
            await this.racerRenderer.initialize('gameCanvas', this.selectedPodConfig);
            
            // Check after async initialization
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
            
            // Start race
            await this.racerRenderer.startVisualRace();
            
            // Final check
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
            
            // Only show alert if not disposed (user didn't navigate away)
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
        // Mark as disposed to stop any async operations
        this.isDisposed = true;
        
        // Clean up renderer
        if (this.racerRenderer) 
        {
            this.racerRenderer.dispose();
            this.racerRenderer = null;
        }
        
        // Clean up pod selection
        if (this.podSelection) 
        {
            this.podSelection.dispose();
            this.podSelection = null;
        }
        
        // Clean up window reference
        if ((window as any).podRacerPage === this) 
        {
            delete (window as any).podRacerPage;
        }
    }
}