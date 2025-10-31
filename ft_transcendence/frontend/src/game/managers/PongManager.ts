// managers/ImprovedGameManager.ts

import { GameConfig, GameState, GameEvent, IGameEngine, Paddlecolor } from '../utils/GameTypes';
import { LocalPongEngine } from '../engines/pong2D/Pong2dEngine';
import { Pong3D } from '../engines/pong3D/Pong3dEngine';


type GameStateStatus = 'menu' | 'matchmaking' | 'playing' | 'paused' | 'ended';
type GameDimension = '2d' | '3d';

export class ImprovedGameManager 
{
    private static instance: ImprovedGameManager;
    
    // Current game
    private currentEngine: IGameEngine | null = null;
    private currentState: GameStateStatus = 'menu';
    private currentConfig: GameConfig | null = null;
    private currentDimension: GameDimension | null = null;
    
    // Canvas reference
    private canvas: HTMLCanvasElement | null = null;
    
    // Event listeners for cleanup
    private eventListeners: Map<string, EventListener[]> = new Map();
    
    // Player preferences (persisted)
    private playerPreferences = 
    {
        paddle1Color: 'default' as Paddlecolor,
        paddle2Color: 'default' as Paddlecolor,
        lastDifficulty: 'easy' as 'easy' | 'hard',
        lastDimension: '2d' as GameDimension,
        soundEnabled: true,
        volume: 0.5
    };
    
    private constructor() 
    {
        this.loadPreferences();
        this.setupGlobalEventListeners();
    }
    
    // Singleton
    public static getInstance(): ImprovedGameManager 
    {
        if (!ImprovedGameManager.instance) {
            ImprovedGameManager.instance = new ImprovedGameManager();
        }
        return ImprovedGameManager.instance;
    }
    
    
    public async init2DGame(canvas: HTMLCanvasElement, config: GameConfig): Promise<void> 
    {
        return this.initGame(canvas, config, '2d');
    }
    
   
    public async init3DGame(canvas: HTMLCanvasElement, config: GameConfig): Promise<void> 
    {
        return this.initGame(canvas, config, '3d');
    }
    
    
    private async initGame(canvas: HTMLCanvasElement, config: GameConfig, dimension: GameDimension): Promise<void> 
    {
        if (this.currentState === 'playing') 
        {
            console.warn('Game already running. Call cleanup() first.');
            return;
        }
        
        this.canvas = canvas;
        this.currentConfig = config;
        this.currentDimension = dimension;
        
        // Apply player preferences to config
        config.paddlecolor1 = config.paddlecolor1 || this.playerPreferences.paddle1Color;
        config.paddlecolor2 = config.paddlecolor2 || this.playerPreferences.paddle2Color;
        
        try 
        {
            // Create appropriate engine based on dimension and mode
            if (dimension === '2d') 
            {
                switch (config.mode) 
                {
                    case 'local-multiplayer':
                    case 'ai':
                        this.currentEngine = new LocalPongEngine(canvas, config);
                        break;
                        
                    case 'online-multiplayer':
                        throw new Error('Online multiplayer not yet implemented');
                        
                    default:
                        throw new Error(`Unknown game mode: ${config.mode}`);
                }
            } 
            else if (dimension === '3d') 
            {
                switch (config.mode) 
                {
                    case 'local-multiplayer':
                    case 'ai':
                        this.currentEngine = new Pong3D(canvas, config);
                        break;
                        
                    case 'online-multiplayer':
                        throw new Error('3D Online multiplayer not yet implemented');
                        
                    default:
                        throw new Error(`Unknown game mode: ${config.mode}`);
                }
            }
            
            if (!this.currentEngine) 
                throw new Error('Failed to create game engine');
            
            
            // Subscribe to game events
            this.currentEngine.onEvent((event) => this.handleGameEvent(event));
            
            this.currentState = 'playing';
            this.playerPreferences.lastDimension = dimension;
            this.savePreferences();
            
            this.emitEvent('game:initialized', { config, dimension });
            console.log(`✅ ${dimension.toUpperCase()} Game initialized:`, config);
            
        } 
        catch (error) 
        {
            console.error('❌ Failed to initialize game:', error);
            this.currentState = 'menu';
            throw error;
        }
    }
    
    public startGame(): void 
    {
        if (!this.currentEngine) 
        {
            console.error('No game initialized');
            return;
        }
        
        this.currentState = 'playing';
        this.currentEngine.start();
        this.emitEvent('game:started', {});
        console.log('▶️ Game started');
    }
    
    public pauseGame(): void 
    {
        if (!this.currentEngine || this.currentState !== 'playing') 
            return;
        
        this.currentState = 'paused';
        this.currentEngine.pause();
        this.emitEvent('game:paused', {});
        console.log('⏸️ Game paused');
    }
    
    public resumeGame(): void 
    {
        if (!this.currentEngine || this.currentState !== 'paused')
            return;
        
        this.currentState = 'playing';
        this.currentEngine.resume();
        this.emitEvent('game:resumed', {});
        console.log('▶️ Game resumed');
    }
    
    public togglePause(): void 
    {
        if (this.currentState === 'playing') 
            this.pauseGame();
        else if (this.currentState === 'paused') 
            this.resumeGame();
    }
    
    public cleanup(): void 
    {
        if (this.currentEngine) 
        {
            this.currentEngine.stop();
            this.currentEngine.destroy();
            this.currentEngine = null;
        }
        
        this.canvas = null;
        this.currentConfig = null;
        this.currentDimension = null;
        this.currentState = 'menu';
        
        this.emitEvent('game:cleanup', {});
        console.log('🧹 Game cleanup complete');
    }
    
    public async restartGame(): Promise<void> 
    {
        if (!this.canvas || !this.currentConfig || !this.currentDimension) 
        {
            console.error('Cannot restart: missing config');
            return;
        }
        
        const canvas = this.canvas;
        const config = { ...this.currentConfig };
        const dimension = this.currentDimension;
        
        this.cleanup();
        await this.initGame(canvas, config, dimension);
        this.startGame();
    }
    
    public getCurrentState(): GameState | null 
    {
        return this.currentEngine?.getState() || null;
    }
    
    public getStatus(): GameStateStatus 
    {
        return this.currentState;
    }
    
    public isGameActive(): boolean 
    {
        return this.currentState === 'playing' || this.currentState === 'paused';
    }
    
    public getCurrentDimension(): GameDimension | null 
    {
        return this.currentDimension;
    }
    
  
    
    public setPaddleColor(paddle: 1 | 2, color: Paddlecolor): void 
    {
        if (paddle === 1) 
            this.playerPreferences.paddle1Color = color;
        else 
            this.playerPreferences.paddle2Color = color;
        
        this.savePreferences();
        this.emitEvent('preferences:updated', { paddle, color });
        console.log(`🎨 Paddle ${paddle} color set to: ${color}`);
    }
    
    public getPaddleColor(paddle: 1 | 2): Paddlecolor 
    {
        return paddle === 1 
            ? this.playerPreferences.paddle1Color 
            : this.playerPreferences.paddle2Color;
    }
    
    public setDifficulty(difficulty: 'easy' | 'hard'): void 
    {
        this.playerPreferences.lastDifficulty = difficulty;
        this.savePreferences();
    }
    
    public getLastDifficulty(): 'easy' | 'hard' 
    {
        return this.playerPreferences.lastDifficulty;
    }
    
    public getLastDimension(): GameDimension 
    {
        return this.playerPreferences.lastDimension;
    }
    

    
    public on(eventName: string, callback: EventListener): void 
    {
        if (!this.eventListeners.has(eventName)) 
        {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName)!.push(callback);
    }
    
    public off(eventName: string, callback: EventListener): void 
    {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) 
        {
            const index = listeners.indexOf(callback);
            if (index > -1) 
            {
                listeners.splice(index, 1);
            }
        }
    }
    
    private emitEvent(eventName: string, detail: any): void 
    {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
        
        // Also call registered callbacks
        const listeners = this.eventListeners.get(eventName);
        if (listeners) 
        {
            listeners.forEach(callback => callback(event));
        }
    }
    

    
    private setupGlobalEventListeners(): void 
    {
        // Keyboard shortcuts
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isGameActive()) {
                this.togglePause();
            }
        };
        window.addEventListener('keydown', keyHandler);
        this.on('cleanup', () => window.removeEventListener('keydown', keyHandler));
        
        // Handle visibility change (pause when tab is hidden)
        const visibilityHandler = () => {
            if (document.hidden && this.currentState === 'playing') {
                this.pauseGame();
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        this.on('cleanup', () => document.removeEventListener('visibilitychange', visibilityHandler));
    }
    
    private handleGameEvent(event: GameEvent): void 
    {
        console.log('🎮 Game event:', event);
        
        switch (event.type) 
        {
            case 'goal-scored':
                this.emitEvent('game:goal', event);
                // TODO: Play sound effect
                break;
                
            case 'game-ended':
                this.currentState = 'ended';
                this.emitEvent('game:ended', event);
                break;
                
            case 'paddle-hit':
                this.emitEvent('game:paddle-hit', event);
                // TODO: Play sound effect
                break;
                
            case 'wall-hit':
                this.emitEvent('game:wall-hit', event);
                // TODO: Play sound effect
                break;
        }
    }
    
  
    private savePreferences(): void 
    {
        try 
        {
            localStorage.setItem('pong_preferences', JSON.stringify(this.playerPreferences));
        } 
        catch (e) 
        {
            console.warn('Failed to save preferences:', e);
        }
    }
    
    private loadPreferences(): void 
    {
        try 
        {
            const saved = localStorage.getItem('pong_preferences');
            if (saved) 
            {
                this.playerPreferences = { ...this.playerPreferences, ...JSON.parse(saved) };
            }
        } 
        catch (e) 
        {
            console.warn('Failed to load preferences:', e);
        }
    }
    
    
    public destroy(): void 
    {
        this.cleanup();
        this.eventListeners.clear();
        console.log('💀 GameManager destroyed');
    }
}

// Export singleton instance
export const gameManager = ImprovedGameManager.getInstance();
