import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import {  OGameEvent } from "@/game/utils/OnlineInterface";
import { Ball } from "./entities/Ball";
import { paddle } from "./entities/Paddle";

// Define what we expect the connection to look like based on your WebSocketService
interface WebSocketLikeConnection 
{
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    send(type: string, payload: any): boolean; 
    isConnected(): boolean;
}

export class OnlinePongEngine implements GameEngine 
{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    
    // Game objects 
    private ball: Ball;
    private paddleLeft: paddle;
    private paddleRight: paddle;
    
    // Network
    private connection: WebSocketLikeConnection; 
    private gameId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';
    
    // SERVER DIMENSIONS - The backend uses these fixed dimensions for physics
    private readonly SERVER_WIDTH = 958;
    private readonly SERVER_HEIGHT = 538;
  

    // State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: {[key: string]: boolean} = {};
    
    // Input throttling
    private lastInputSent: number = 0;
    private inputThrottle: number = 16; // Match 60 FPS game loop (~16ms per frame)
    private lastDirection: 'up' | 'down' | 'none' = 'none';
    
    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;
    
    // Events
    private eventCallbacks: Array<(event: GameEvent) => void> = [];
    
    constructor(
        canvas: HTMLCanvasElement, 
        config: GameConfig, 
        connection: any, 
        gameId: string, 
        playerId: string, 
        playerSide: 'left' | 'right'
    ) 
    {
        this.canvas = canvas;
        this.connection = connection;
        this.gameId = gameId;
        this.playerId = playerId;
        this.playerSide = playerSide;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) 
            throw Error("Failed to get 2d context");
        this.ctx = ctx;
        
        // Initialize visual objects
        this.ball = new Ball(canvas.width / 2, canvas.height / 2, 7);
        this.paddleLeft = new paddle("left", canvas, config.paddlecolor1 || 'default');
        this.paddleRight = new paddle("right", canvas, config.paddlecolor2 || 'default');
        
        console.log(`[OnlineEngine] Init: gameId=${gameId}, playerId=${playerId}, side=${playerSide}`);
        console.log(`[OnlineEngine] Canvas dimensions:`, canvas.width, 'x', canvas.height);
        console.log(`[OnlineEngine] Initial ball:`, this.ball.x, this.ball.y, 'r:', this.ball.radius);
        console.log(`[OnlineEngine] Initial paddle left:`, this.paddleLeft.x, this.paddleLeft.y);
        console.log(`[OnlineEngine] Initial paddle right:`, this.paddleRight.x, this.paddleRight.y);
        
        // Setup
        this.setupNetworkListeners();       
        this.setupInputHandlers();
    }
    
    // NETWORK SETUP
    private setupNetworkListeners(): void {
        // Listen for state updates from server
        this.connection.on('game:state', (data: any) => 
        {
            // Safety check: make sure this update is for our game
            if (data && data.gameId === this.gameId) {
                //console.log('Recv State:', data); // Debug log
                this.applyServerState(data.state);
            }
        });
        
        // Listen for game events
        this.connection.on('game:event', (data: OGameEvent['payload']) => 
        {
            if (data && data.gameId === this.gameId) {
                //console.log('Received game event', data.event);
                this.handleServerEvent(data.event);
            }
        });
    }
    
    private applyServerState(state: any): void 
    {
        if (!state) return;

        // Calculate scale factors (server coords -> client canvas coords)
        const scaleX = this.canvas.width / this.SERVER_WIDTH;
        const scaleY = this.canvas.height / this.SERVER_HEIGHT;
        
        // Scale ball position from server coordinates to canvas coordinates
        this.ball.x = state.ball.x * scaleX;
        this.ball.y = state.ball.y * scaleY;
        
        // Scale velocities (not used for rendering, but kept for consistency)
        this.ball.dx = state.ball.dx * scaleX;
        this.ball.dy = state.ball.dy * scaleY;
        
        // Scale paddle positions - server sends Y coordinate of paddle top
        if (state.paddle1) {
            this.paddleLeft.y = state.paddle1.y * scaleY;
        }
        if (state.paddle2) {
            this.paddleRight.y = state.paddle2.y * scaleY;
        }
        
        // Update Scores (server sends "scores" object with player1/player2 properties)
        if (state.scores) {
             const newP1 = state.scores.player1 || 0;
             const newP2 = state.scores.player2 || 0;
             
             // Only emit if changed to avoid spam
             if (newP1 !== this.player1Score || newP2 !== this.player2Score) {
                 this.player1Score = newP1;
                 this.player2Score = newP2;
                 
                 console.log('[OnlineEngine] Score updated:', newP1, '-', newP2);
                 
                 this.emitEvent({
                    type: 'score-updated',
                    player1Score: this.player1Score,
                    player2Score: this.player2Score
                });
             }
        }
    }
    
    private handleServerEvent(event: OGameEvent['payload']['event']): void 
    {
        switch (event.type) 
        {
            case 'goal':
                this.emitEvent({
                    type: 'goal-scored',
                    scorer: event.data?.scorer || 'player1'
                });
                break;
                
            case 'paddle-hit':
                this.emitEvent({
                    type: 'paddle-hit',
                    paddle: event.data?.paddle || 'left'
                });
                break;
                
            case 'wall-hit':
                this.emitEvent({ type: 'wall-hit' });
                break;
                
            case 'game-end':
                this.ended = true;
                this.emitEvent({
                    type: 'game-ended',
                    winner: event.data?.winner || 'player1'
                });
                break;
        }
        
    }
    
    // SEND INPUT TO SERVER
    private sendInput(): void {
        const now = Date.now();
        
        // Determine current input direction
        let direction: 'up' | 'down' | 'none' = 'none';
        
        if (this.playerSide === 'left') 
        {
            // If both keys pressed, do nothing (conflicting input)
            if (this.keys['w'] && this.keys['s']) {
                direction = 'none';
            }
            else if (this.keys['w'])
            {
                direction = 'up';
            }     
            else if (this.keys['s'])
            {
                direction = 'down';
            } 
        } 
        else     
        {
            // If both keys pressed, do nothing (conflicting input)
            if (this.keys['arrowup'] && this.keys['arrowdown']) {
                direction = 'none';
            }
            else if (this.keys['arrowup'])
            {
                direction = 'up';
            } 
            else if (this.keys['arrowdown']) 
            {
                direction = 'down';
            }
        }
        
        // Send if direction changed OR enough time passed (for continuous input)
        const shouldSend = direction !== this.lastDirection || (now - this.lastInputSent >= this.inputThrottle) || direction != 'none';
        
        if (!shouldSend) {
            return;
        }
        
        // 3. FIXED SEND: Split into Type and Payload
        const sent = this.connection.send('game:input', {
            gameId: this.gameId,
            playerId: this.playerId,
            input: {
                direction,
            }
        });
        
        if (sent) {
            this.lastInputSent = now;
            this.lastDirection = direction;
        }
    }
    
    // GAME LOOP 
    start(): void 
    {
        if (this.paused) 
            this.paused = false;
        
        console.log('[OnlineEngine] Sending Ready Signal');

        // 4. FIXED SEND: Split into Type and Payload
        this.connection.send('game:ready', {
            gameId: this.gameId,
            playerId: this.playerId
        });
        
        this.update();
    }
    
    stop(): void 
    {
        if (this.animationFrameId) 
        {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.paused = true;
    }
    
    pause(): void 
    {
        // Online games usually can't be paused by one client, 
        // but we can stop rendering locally or show a menu.
        this.paused = true;
        this.emitEvent({ type: 'game-paused' });
    }
    
    resume(): void 
    {
        this.paused = false;
        this.emitEvent({ type: 'game-resumed' });
        this.update();
    }
    
    private update = (): void => 
    {
        if (this.ended || this.paused) 
            return;
        
        // Send input to server
        this.sendInput();
        
        // Render current state
        this.clear();
        this.render();
        this.animationFrameId = requestAnimationFrame(this.update);
    };
    
    private clear(): void 
    {
        // Fill with dark background instead of just clearing
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    private render(): void 
    {
        // Draw center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ball.draw(this.ctx);
        this.paddleLeft.draw(this.ctx);
        this.paddleRight.draw(this.ctx);

        // Debug: Draw scores
        this.ctx.fillStyle = "white";
        this.ctx.font = "32px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`${this.player1Score}`, this.canvas.width / 4, 50);
        this.ctx.fillText(`${this.player2Score}`, (this.canvas.width / 4) * 3, 50);
    }
    
    // INTERFACE IMPLEMENTATION
    getState(): GameState 
    {
        return {
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                dx: this.ball.dx,
                dy: this.ball.dy,
            },
            paddle1: {
                y: this.paddleLeft.y,
            },
            paddle2: {
                y: this.paddleRight.y,
            },
            timestamp: Date.now()
        };
    }
    
    onEvent(callback: (event: GameEvent) => void): void 
    {
        this.eventCallbacks.push(callback);
    }
    
    destroy(): void 
    {
        this.stop();
        this.removeInputHandlers();
        
        // 5. FIXED SEND: Split into Type and Payload
        this.connection.send('game:leave', {
            gameId: this.gameId,
            playerId: this.playerId
        });

       
        
        this.eventCallbacks = [];
    }
    
    // INPUT HANDLING
    private keydownHandler = (e: KeyboardEvent): void => 
    {
        // Ignore keyboard repeat events to prevent spam
        if (e.repeat) return;
        
        const key = e.key.toLowerCase();
        this.keys[key] = true;
    };
    
    private keyupHandler = (e: KeyboardEvent): void => 
    {
        this.keys[e.key.toLowerCase()] = false;
    };
    
    private blurHandler = (): void => 
    {
        // Clear all keys when window loses focus to prevent stuck keys
        this.keys = {};
    };
    
    private setupInputHandlers(): void 
    {
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        window.addEventListener('blur', this.blurHandler);
    }
    
    private removeInputHandlers(): void
    {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        window.removeEventListener('blur', this.blurHandler);
    }
    
    private emitEvent(event: GameEvent): void 
    {
        this.eventCallbacks.forEach(callback => callback(event));
    }
}