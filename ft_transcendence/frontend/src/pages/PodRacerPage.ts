// ====================================================
// PodRacerPage.ts - MINIMAL PAGE CONTAINER
// ====================================================
import { BaseComponent } from '../components/BaseComponent';
import { PodSelection, PodSelectionEvent } from './PodSelectionPage';
import { RacerRenderer } from '../game/engines/racer/RacerRenderer';
import { PodConfig, AVAILABLE_PODS } from '../game/utils/PodConfig';
import { navigateTo } from '../router/router';

export default class PodRacerPage extends BaseComponent 
{
    // SINGLE RESPONSIBILITY: Page routing and one method call
    private racerRenderer: RacerRenderer | null = null;
    private podSelection: PodSelection | null = null;
    private selectedPodConfig: PodConfig = AVAILABLE_PODS[0];
    
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
        (window as any).podRacerPage = this;
        this.showPodSelection();
        this.setupPageCleanup();
    }

    // Show pod selection
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

    // Pod selected - start race
    private onPodSelected(event: PodSelectionEvent): void 
    {
        this.selectedPodConfig = event.selectedPod;
        event.onConfirm();
        
        // Hide pod selection, show canvas and back button
        this.showRaceView();
        
        this.startRace();
    }

    // Switch from pod selection to race view
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
            if (!this.racerRenderer) 
            {
                this.racerRenderer = new RacerRenderer(
                {
                    debugMode: false,
                    performanceMonitoring: true,
                    cameraMode: 'racing'
                });
            }
            
            if (!this.racerRenderer) 
            {
                throw new Error('Failed to create RacerRenderer');
            }
            
            await this.racerRenderer.initialize('gameCanvas', this.selectedPodConfig);
            
            if (!this.racerRenderer) 
            {
                throw new Error('RacerRenderer became null after initialization');
            }
            
            await this.racerRenderer.startVisualRace();
        } 
        catch (error) 
        {
            console.error('PODRACER-PAGE: Race start failed:', error);
            alert('Failed to start race. Returning to game selection.');
            this.goBack();
        }
    }
    
    // Back button handler
    public goBack(): void 
    {
        // Cleanup everything
        this.dispose();
        
        // Navigate back
        setTimeout(() => 
        {
            navigateTo('/games');
        }, 100);
    }
    
    // Page cleanup
    private setupPageCleanup(): void 
    {
        window.addEventListener('beforeunload', () => 
        {
            this.dispose();
        });
    }
    
    // Cleanup
    dispose(): void 
    {
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