import { GameConfig, GameState, GameEvent, GameEngine, Paddlecolor } from '../utils/GameTypes';
import { LocalPongEngine } from '../engines/pong2D/Pong2dEngine';
import { Pong3D } from '../engines/pong3D/Pong3dEngine';
import { webSocketService } from '@/services/websocket/WebSocketService';
import { OnlinePongEngine } from '../engines/pong2D/Pong2dOnline';
import { OnlinePong3D } from '../engines/pong3D/Pong3dOnline';

type GameStateStatus = 'menu' | 'matchmaking' | 'playing' | 'paused' | 'ended';
type GameDimension = '2d' | '3d';

export class GameManager {
    
    private play_sound() 
    {
        if (!this.playerPreferences.soundEnabled) 
            return;
        const audio = new Audio('/assets/sounds/sfx/hit.mp3');
        audio.volume = this.playerPreferences.volume ?? 0.5;
        audio.play().catch(err => {
            console.debug('[PongManager] Audio autoplay blocked:', err.message);
        });
    }
    private static instance: GameManager;
    
    // Current game
    private currentEngine: GameEngine | null = null;      //start,stop,pause,resume,destoy,getstate,onevent
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
        paddle1Color: 'fire' as Paddlecolor,
        paddle2Color: 'fire' as Paddlecolor,
        lastDifficulty: 'easy' as 'easy' | 'hard',
        lastDimension: '2d' as GameDimension,
        soundEnabled: true,
        volume: 0.5
    };
    
    private constructor() 
    {
        this.setupGlobalEventListeners();
    }
    
    // Singleton
    public static getInstance(): GameManager 
    {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    
    
    public async init2DGame(canvas: HTMLCanvasElement, config: GameConfig, onlineData?:{matchId: string; side: 'left' | 'right'; userId: string}): Promise<void> 
    {
        return this.initGame(canvas, config, '2d', onlineData);
    }
    
   
    public async init3DGame(canvas: HTMLCanvasElement, config: GameConfig, onlineData?:{matchId: string; side: 'left' | 'right'; userId: string}): Promise<void> 
    {
        return this.initGame(canvas, config, '3d', onlineData);
    }
    
    
    private async initGame(canvas: HTMLCanvasElement, config: GameConfig, dimension: GameDimension, onlineData?:{matchId: string; side: 'left' | 'right'; userId: string}): Promise<void> 
    {
        if (this.currentState === 'playing') 
        {
            console.warn('Game already running. Call cleanup() first.');
            return;
        }
        
        this.canvas = canvas;
        this.currentConfig = config;
        this.currentDimension = dimension;
        
        config.paddlecolor1 = config.paddlecolor1 || this.playerPreferences.paddle1Color;
        config.paddlecolor2 = config.paddlecolor2 || this.playerPreferences.paddle2Color;
        
        try 
        {
            
            if (dimension === '2d') 
            {
                switch (config.mode) 
                {
                    case 'local-multiplayer':
                    case 'ai':
                        this.currentEngine = new LocalPongEngine(canvas, config);
                        break;
                        
                    case 'online-multiplayer':
                        if (!onlineData) 
                            throw new Error('Missing online game data');
                        
                        this.currentEngine = new OnlinePongEngine(
                            canvas, 
                            config, 
                            webSocketService, 
                            onlineData.matchId, 
                            onlineData.userId, 
                            onlineData.side
                        );
                        break;
                        
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
                        if (!onlineData) 
                            throw new Error('Missing online game data');
                        
                        this.currentEngine = new OnlinePong3D(
                            canvas, 
                            config, 
                            webSocketService, 
                            onlineData.matchId, 
                            onlineData.userId, 
                            onlineData.side
                        );
                        break;
                        
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
            
            
        } 
        catch (error) 
        {
            this.currentState = 'menu';
            throw error;
        }
    }
    
    public startGame(): void 
    {
        if (!this.currentEngine) 
        {
            return;
        }
        this.currentState = 'playing';
        this.currentEngine.start();
        this.emitEvent('game:started', {});
        
    }
    
    public pauseGame(): void 
    {
        if (!this.currentEngine || this.currentState !== 'playing') 
            return;
        
        this.currentState = 'paused';
        this.currentEngine.pause();
        this.emitEvent('game:paused', {});
        
    }
    
    public resumeGame(): void 
    {
        if (!this.currentEngine || this.currentState !== 'paused')
            return;
        
        this.currentState = 'playing';
        this.currentEngine.resume();
        this.emitEvent('game:resumed', {});
        
    }
    
    public togglePause(): void 
    {
        if (this.currentState === 'playing')
            this.pauseGame();
        else if (this.currentState === 'paused') 
            this.resumeGame();
    }
    
    public resizeGame(newWidth: number, newHeight: number): void 
    {
        if (!this.currentEngine) 
        {
            return;
        }
    
        if ('resize' in this.currentEngine && typeof this.currentEngine.resize === 'function') 
        {
            this.currentEngine.resize(newWidth, newHeight);
        }
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
    }
    
    public async restartGame(): Promise<void> 
    {
        if (!this.canvas || !this.currentConfig || !this.currentDimension) 
        {
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
            
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const lobbyId = urlParams.get('id') || urlParams.get('lobbyId');
                if (lobbyId && typeof (window as any).webSocketService !== 'undefined' && webSocketService.isConnected()) {
                    webSocketService.send('lobby:player:update', {
                        lobbyId,
                        paddle: color
                    });
                }
            } catch (err) {
            }
        
    }
    
    public getPaddleColor(paddle: 1 | 2): Paddlecolor 
    {
        return paddle === 1 
            ? "neon"
            : "ice";
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
            if (e.key === 'Escape' && this.isGameActive() && this.currentConfig?.mode != 'online-multiplayer') {
                this.togglePause();
            }
        };
        window.addEventListener('keydown', keyHandler);
        this.on('cleanup', () => window.removeEventListener('keydown', keyHandler));
        
    }
    
    private handleGameEvent(event: GameEvent): void 
    {
        switch (event.type) 
        {
            case 'goal-scored':
                this.emitEvent('game:goal', event);
                break;
                
            case 'game-ended':
                this.currentState = 'ended';
                this.emitEvent('game:ended', event);
                this.play_sound_end()
                break;
                
            case 'paddle-hit':
                this.emitEvent('game:paddle-hit', event);
                this.play_paddle_hit();
                break;
                
            case 'wall-hit':
                this.emitEvent('game:wall-hit', event);
                this.play_sound();
                break;
                
            case 'score-updated':
                this.emitEvent('game:score-update', { 
                    player1Score: event.player1Score, 
                    player2Score: event.player2Score 
                });
                this.play_sound_goal();
                break;
        }
    }
    
  
    private savePreferences(): void 
    {
        try 
        {
            localStorage.setItem('pong_preferences', JSON.stringify(this.playerPreferences));
        } catch (e) {}
    }
    private play_sound_goal() 
    {
        const audio = new Audio('/assets/sounds/sfx/goal.mp3');
        audio.volume = 0.6;
        audio.play().catch(err => {
            console.debug('[PongManager] Audio autoplay blocked:', err.message);
        });
    }
    private play_sound_end() 
    {
        const audio = new Audio('/assets/sounds/sfx/gameend.mp3');
        audio.volume = 0.6;
        audio.play().catch(err => {
            console.debug('[PongManager] Audio autoplay blocked:', err.message);
        });
    }

    private play_paddle_hit()
    {
        const audio = new Audio('/assets/sounds/sfx/paddlehit.mp3');
        audio.volume = 0.6;
        audio.play().catch(err => {
            console.debug('[PongManager] Audio autoplay blocked:', err.message);
        });
    }
}
// Export singleton instance
export const gameManager = GameManager.getInstance();