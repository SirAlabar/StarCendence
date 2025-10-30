// pages/PongPage.ts
import { BaseComponent } from '../components/BaseComponent';
import { gameManager } from '../game/managers/PongManager';
import { PongMenu } from './PongMenus';

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
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
                            <div id="mainMenu" class="flex flex-col space-y-3 bg-black/90 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/50 max-h-[80vh] overflow-y-auto">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    mount(): void 
    {
        // Initialize menu with callbacks
        this.menu = new PongMenu({
            onStart2DGame: () => this.start2DGame(),
            onStart3DGame: () => this.start3DGame(),
            onBackToGames: () => this.goBack()
        });
        
       
        this.menu.showModeSelection();
        
    
        gameManager.on('game:ended', (e: Event) => {
            const customEvent = e as CustomEvent;
            this.handleGameEnd(customEvent.detail.winner);
        });
        
        gameManager.on('game:goal', () => {
            console.log('⚽ GOAL!');
            // todo goal sound
        });
        
        gameManager.on('game:paddle-hit', () => {
            console.log('🏓 Paddle hit!');
            // todo paddle hit sound
        });
        
        console.log('✅ PongPage mounted');
    }

    
    private async start2DGame(): Promise<void> 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            console.error('❌ Canvas not found');
            return;
        }
        
        // Hide menu
        if (menu) 
            menu.style.display = 'none';
        
        // Resize canvas to fit container
        this.resizeCanvas(canvas);
        
        
        const selections = this.menu.getSelections();
        console.log('🎮 Starting 2D Game with config:', selections);
        
        // Initialize 2D game with game manager
        try 
        {
            await gameManager.init2DGame(canvas, 
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
            console.log('2D Game started successfully');
            
        } 
        catch (error) 
        {
            console.error('❌ Failed to start 2D game:', error);
            alert('Failed to start 2D game. Please try again.');
            this.menu.showMenuAfterGame();
        }
    }
    
    private async start3DGame(): Promise<void> 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            console.error('❌ Canvas not found');
            return;
        }
        
        if (menu) 
            menu.style.display = 'none';
        
    
        this.resizeCanvas(canvas);
        const selections = this.menu.getSelections();
        console.log('Starting 3D Game with config:', selections);
        gameManager.cleanup();
        
        // Initialize 3D game through game manager
        try 
        {
            await gameManager.init3DGame(canvas, 
            {
                mode: selections.mode,
                difficulty: selections.mode === 'ai' ? selections.difficulty : undefined,
                paddlecolor1: selections.paddle1Color,
                paddlecolor2: selections.paddle2Color,
                gamewidth: canvas.width,
                gameheight: canvas.height
            });
            
            gameManager.startGame();
            console.log(' 3D Game started successfully');
            
        } catch (error) 
        {
            console.error('❌ Failed to start 3D game:', error);
            alert('Failed to start 3D game. Please try again.');
            this.menu.showMenuAfterGame();
        }
    }
    
    
    private handleGameEnd(winner: 'player1' | 'player2'): void 
    {
        const selections = this.menu.getSelections();
        let winnerName: string;
        if (winner === 'player1') 
            winnerName = 'Player 1';
        else 
            winnerName = selections.mode === 'ai' ? 'AI' : 'Player 2';
        
        
        console.log(`${winnerName} wins!`);
        this.showWinnerOverlay(winnerName);
        
        // Show menu after delay
        setTimeout(() => {
            this.hideWinnerOverlay();
            this.menu.showMenuAfterGame();
        }, 3000);
    }
    
    private showWinnerOverlay(winner: string): void 
    {
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        if (!canvas) 
            return;
        
        
        let overlay = document.getElementById('winnerOverlay');
        if (!overlay) 
        {
            overlay = document.createElement('div');
            overlay.id = 'winnerOverlay';
            overlay.className = 'absolute inset-0 flex items-center justify-center bg-black/80 z-40';
            canvas.parentElement?.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="text-center animate-pulse">
                <h2 class="text-6xl font-bold text-white mb-4"></h2>
                <h3 class="text-4xl font-bold text-cyan-400">${winner} Wins!</h3>
            </div>
        `;
        overlay.style.display = 'flex';
    }
    
    private hideWinnerOverlay(): void 
    {
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) 
        {
            overlay.style.display = 'none';
        }
    }
    

    private resizeCanvas(canvas: HTMLCanvasElement): void 
    {
        const container = canvas.parentElement;
        if (!container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        console.log(` Canvas resized to ${canvas.width}x${canvas.height}`);
    }
    
    private setupResizeListener(canvas: HTMLCanvasElement): void 
    {
        
        if (this.resizeListener) 
            window.removeEventListener('resize', this.resizeListener);
        
        this.resizeListener = () => 
        {
            if (!canvas) 
                return;
    
            if (gameManager.getCurrentDimension() !== '2d') 
                return;
            
            const container = canvas.parentElement;
            if (!container) 
                return;
            
            console.log('Window resized, adjusting canvas...');
            gameManager.pauseGame();
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            gameManager.resumeGame();
        };
        
        window.addEventListener('resize', this.resizeListener);
        console.log('✅ Resize listener attached');
    }

    
    private goBack(): void 
    {
        console.log('Navigating back to games');
        this.dispose();
        
        if ((window as any).navigateTo) 
        {
            (window as any).navigateTo('/games');
        }
        else 
        {
            console.warn('⚠️ navigateTo function not found');
        }
    }
    
 
    
    public dispose(): void 
    {
        console.log('🧹 Disposing PongPage...');
        
      
        gameManager.cleanup();
        
        // Remove resize listener
        if (this.resizeListener) 
        {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
        
        // Remove winner overlay
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) 
        {
            overlay.remove();
        }
        
        console.log('PongPage disposed');
    }
}