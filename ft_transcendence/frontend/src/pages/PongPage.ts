// pages/PongPage.ts
import { BaseComponent } from '../components/BaseComponent';
import { gameManager } from '../game/managers/PongManager';
import { Pong3Dscene } from '@/game/engines/pong3D/Engine';
import { PongMenu } from './PongMenus';

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
    private pong3d!: Pong3Dscene;
    private menu!: PongMenu;
    
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 -mt-20 pt-20">
                <div class="flex items-center justify-center">
                    <div class="relative w-full max-w-7xl" style="aspect-ratio: 4/3; max-height: 80vh;">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                        ></canvas>
                    
                        <!-- Menu Overlay -->
                        <div id="pongMenuContainer" class="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-50">
                            <div id="mainMenu" class="flex flex-col space-y-3 bg-black/90 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/50">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    mount(): void 
    {
        
        this.menu = new PongMenu({
            onStart2DGame: () => this.start2DGame(),
            onStart3DGame: (mode) => this.start3DGame(mode),
            onBackToGames: () => this.goBack()
        });

        this.menu.showModeSelection();
        gameManager.on('game:ended', (e: Event) => {
            const customEvent = e as CustomEvent;
            this.handleGameEnd(customEvent.detail.winner);
        });
        
        gameManager.on('game:goal', () => {
            console.log('⚽ GOAL!');
        });
    }

    private async start2DGame(): Promise<void> 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            console.error('Canvas not found');
            return;
        }
        
        // Hide menu
        if (menu) {
            menu.style.display = 'none';
        }
        
        // Resize canvas to fit container
        this.resizeCanvas(canvas);
        
        // Get selections from menu
        const selections = this.menu.getSelections();
        
        // Initialize game 
        try {
            await gameManager.initGame(canvas, 
            {
                mode: selections.mode,
                difficulty: selections.mode === 'ai' ? selections.difficulty : undefined,
                paddlecolor1: selections.paddle1Color,
                paddlecolor2: selections.paddle2Color,
                gamewidth: canvas.width,
                gameheight: canvas.height
            });
            
            gameManager.startGame();
            this.setupResizeListener(canvas);
            
        } 
        catch (error) 
        {
            console.error('Failed to start game:', error);
            alert('Failed to start game. Please try again.');
            this.menu.showMenuAfterGame();
        }
    }

    private start3DGame(mode: "ai" | "multiplayer"): void 
    {
        const menu = document.getElementById("pongMenuContainer");
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;

        if (menu) 
        {
            menu.style.display = "none";
        }
        
        if (canvas) 
        {
            console.log('Starting 3D Pong:', mode);
            gameManager.cleanup();
            
            if (mode === "multiplayer") {
                this.pong3d = new Pong3Dscene(canvas, "multiplayer");
            } else {
                this.pong3d = new Pong3Dscene(canvas, "ai");
            }
        }
    }

    private handleGameEnd(winner: 'player1' | 'player2'): void 
    {
        const selections = this.menu.getSelections();
        const winnerName = winner === 'player1' ? 'Player 1' : 
                          (selections.mode === 'ai' ? 'AI' : 'Player 2');
        
        console.log(`🎉 ${winnerName} wins!`);
    
        setTimeout(() => {
            this.menu.showMenuAfterGame();
        }, 2000);
    }

    private resizeCanvas(canvas: HTMLCanvasElement): void 
    {
        const container = canvas.parentElement;
        if (!container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    private setupResizeListener(canvas: HTMLCanvasElement): void 
    {
        if (this.resizeListener) 
        {
            window.removeEventListener('resize', this.resizeListener);
        }
        
        this.resizeListener = () => {
            if (!canvas) return;
            
            const container = canvas.parentElement;
            if (!container) return;
            
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            
            gameManager.pauseGame();
            canvas.width = newWidth;
            canvas.height = newHeight;
            gameManager.resumeGame();
        };
        
        window.addEventListener('resize', this.resizeListener);
    }
    
    private goBack(): void 
    {
        this.dispose();
        
        if ((window as any).navigateTo) {
            (window as any).navigateTo('/games');
        }
    }
    
    public dispose(): void 
    {
        gameManager.cleanup();
        
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }
}