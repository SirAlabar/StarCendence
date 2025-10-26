import { PongScene } from '@/game/engines/pong2D/PongScene';
import { AiDifficulty } from '@/game/engines/pong2D/entities/EnemyAi';
import { Pong3Dscene } from '../engines/pong3D/Engine';

type GameState = 'menu' | 'playing' | 'paused' | 'ended';
type GameMode = 'multiplayer' | 'ai';

interface GameConfig 
{
    mode: GameMode;
    difficulty?: AiDifficulty;
}

export class GameManager 
{
    private static instance: GameManager;
    
    // Game state
    private currentState: GameState = 'menu';
    private pongScene: PongScene | null = null;
    private pongScene3d!: Pong3Dscene | null
    private canvas: HTMLCanvasElement | null = null;
    private gameConfig: GameConfig | null = null;
    
    // Event listeners storage for cleanup
    private eventListeners: Map<string, EventListener> = new Map();
    
    private constructor() 
    {
        this.setupGlobalEventListeners();
    }
    
    // Singleton pattern
    public static getInstance(): GameManager 
    {
        if (!GameManager.instance) 
        {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    
    // Setup global event listeners
    private setupGlobalEventListeners(): void 
    {
        // Listen to header pause button
        const pauseHandler = () => this.togglePause();
        window.addEventListener('game:pause', pauseHandler);
        this.eventListeners.set('game:pause', pauseHandler);
        
        // Listen to header exit button
        const exitHandler = () => this.exitGame();
        window.addEventListener('game:exit', exitHandler);
        this.eventListeners.set('game:exit', exitHandler);
        
        // Listen to game end from PongScene
        const gameEndHandler = (e: Event) => 
        {
            const customEvent = e as CustomEvent;
            this.handleGameEnd(customEvent.detail);
        };
        window.addEventListener('pong:gameEnd', gameEndHandler);
        this.eventListeners.set('pong:gameEnd', gameEndHandler);
    }
    
    // Initialize game
    public initGame(canvas: HTMLCanvasElement, config: GameConfig): void 
    {
        if (this.currentState === 'playing') 
        {
            console.warn('Game already running');
            return;
        }
        
        this.canvas = canvas;
        this.gameConfig = config;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) 
        {
            console.error('Failed to get canvas context');
            return;
        }
        
        // Create PongScene instance
        if (config.mode === 'ai' && config.difficulty) 
        {
            this.pongScene = new PongScene(ctx, config.mode, config.difficulty);
        }
        else 
        {
            this.pongScene = new PongScene(ctx, config.mode);
        }
        
        this.currentState = 'playing';
        console.log('GameManager: Game initialized', config);
    }
    
    public initGame3D(canvas: HTMLCanvasElement, config: GameConfig): void 
    {
        if (this.currentState === 'playing') 
        {
            console.warn('Game already running');
            return;
        }

        this.canvas = canvas;
        this.gameConfig = config;

        
        try 
        {
            this.pongScene3d = new Pong3Dscene(canvas);
        } 
        catch (error) 
        {
            console.error('Failed to initialize 3D scene:', error);
            return;
        }

        this.currentState = 'playing';
        console.log('GameManager: 3D Game initialized', config);
    }

    // Start game
    public startGame(): void 
    {
        if (this.pongScene) 
        {
            if (this.currentState === 'paused') 
            {
                this.resumeGame();
                return;
            }
            this.currentState = 'playing';
            this.pongScene.start();
            console.log('GameManager: 2D Game started');
        } 
        else if (this.pongScene3d) 
        {
            this.currentState = 'playing';
            console.log('GameManager: 3D Game started');
        } 
        else 
        {
            console.error('GameManager: Cannot start - game not initialized');
        }
    }
    
    // Pause game
    public pauseGame(): void 
    {
        if (!this.pongScene || this.currentState !== 'playing') 
        {
            return;
        }
        
        this.currentState = 'paused';
        this.pongScene.stop();
        console.log('GameManager: Game paused');
    }
    
    // Resume game
    public resumeGame(): void 
    {
        if (!this.pongScene || this.currentState !== 'paused') 
        {
            return;
        }
        
        this.currentState = 'playing';
        this.pongScene.start();
        console.log('GameManager: Game resumed');
    }
    
    // Toggle pause/resume
    public togglePause(): void 
    {
        if (!this.pongScene) 
        {
            return;
        }
        
        if (this.currentState === 'playing') 
        {
            this.pauseGame();
        }
        else if (this.currentState === 'paused') 
        {
            this.resumeGame();
        }
    }
    
    // Handle game end
    private handleGameEnd(winner: string): void 
    {
        this.currentState = 'ended';
        console.log(`GameManager: Game ended - ${winner} won`);
        
        // Dispatch event for PongPage to show menu
        window.dispatchEvent(new CustomEvent('gameManager:showMenu', 
        {
            detail: { winner }
        }));
    }
    
    // Exit game and navigate
    public exitGame(): void 
    {
        this.cleanup();
        
        // Navigate using SPA router
        if ((window as any).navigateTo) 
        {
            (window as any).navigateTo('/games');
        }
        else 
        {
            console.error('GameManager: navigateTo not found');
        }
    }
    
    // Restart game with same config
    public restartGame(): void 
    {
        if (!this.canvas || !this.gameConfig) 
        {
            console.error('GameManager: Cannot restart - missing config');
            return;
        }
        
        this.cleanup();
        this.initGame(this.canvas, this.gameConfig);
        this.startGame();
    }
    
    // Cleanup current game
    public cleanup(): void 
    {
    if (this.pongScene) 
    {
        this.pongScene.stop();
        this.pongScene = null;
    }
    if (this.pongScene3d) 
    {
        this.pongScene3d.dispose();
        this.pongScene3d = null;
    }

    this.canvas = null;
    this.gameConfig = null;
    this.currentState = 'menu';
    
    console.log('GameManager: Cleanup complete');
}
    
    // Get current state
    public getState(): GameState 
    {
        return this.currentState;
    }
    
    // Check if game is active
    public isGameActive(): boolean 
    {
        return this.currentState === 'playing' || this.currentState === 'paused';
    }
    
    // Destroy manager (cleanup all listeners)
    public destroy(): void 
    {
        this.cleanup();
        
        // Remove all event listeners
        this.eventListeners.forEach((listener, event) => 
        {
            window.removeEventListener(event, listener);
        });
        
        this.eventListeners.clear();
        console.log('GameManager: Destroyed');
    }

    redraw(): void 
    {
        if (this.pongScene && typeof this.pongScene.drawStaticFrame === 'function') 
            this.pongScene.drawStaticFrame();
        else 
        console.warn('GameManager: redraw() called but no active scene found.');
    }

    resizeGame(newWidth: number, newHeight: number): void 
    {
    if (this.pongScene) 
            this.pongScene.onResize(newWidth, newHeight);
    }
}

// Export singleton instance
export const gameManager = GameManager.getInstance();