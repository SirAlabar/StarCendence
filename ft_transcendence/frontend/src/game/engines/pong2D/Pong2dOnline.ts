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
    private matchId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';
    
    // SCALING: The dimensions the SERVER uses for calculations.
    // Most backends use 800x600. If yours is different, change these values!
  

    // State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: {[key: string]: boolean} = {};
    
    // Input throttling
    private lastInputSent: number = 0;
    private inputThrottle: number = 30; // Reduced slightly for smoother movement
    
    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;
    
    // Events
    private eventCallbacks: Array<(event: GameEvent) => void> = [];
    
    constructor(
        canvas: HTMLCanvasElement, 
        config: GameConfig, 
        connection: any, 
        matchId: string, 
        playerId: string, 
        playerSide: 'left' | 'right'
    ) 
    {
        this.canvas = canvas;
        this.connection = connection;
        this.matchId = matchId;
        this.playerId = playerId;
        this.playerSide = playerSide;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) 
            throw Error("Failed to get 2d context");
        this.ctx = ctx;
        
        // Initialize visual objects
        this.ball = new Ball(canvas.width / 2, canvas.height / 2, 10);
        this.paddleLeft = new paddle("left", canvas, config.paddlecolor1 || 'default');
        this.paddleRight = new paddle("right", canvas, config.paddlecolor2 || 'default');
        
        // Setup
        this.setupNetworkListeners();       
        this.setupInputHandlers();          
        
        console.log(`[OnlineEngine] Init: ${matchId}, ${playerId}, ${playerSide}`);
    }
    
    // NETWORK SETUP
    private setupNetworkListeners(): void {
        // Listen for state updates from server
        this.connection.on('game:state', (data: any) => 
        {
            // Safety check: make sure this update is for our match
            if (data && data.matchId === this.matchId) {
                //console.log('Recv State:', data); // Debug log
                this.applyServerState(data.state);
            }
        });
        
        // Listen for game events
        this.connection.on('game:event', (data: OGameEvent['payload']) => 
        {
            if (data && data.matchId === this.matchId) {
                //console.log('Received game event', data.event);
                this.handleServerEvent(data.event);
            }
        });
    }
    
    private applyServerState(state: any): void 
    {
        if (!state) return;

        // --- SCALING LOGIC ---
        // Calculate ratio between local canvas size and server world size
        //const scaleX = this.canvas.width / this.SERVER_WIDTH;
        //const scaleY = this.canvas.height / this.SERVER_HEIGHT;

        // Update ball with scaling
        this.ball.x = state.ball.x;
        this.ball.y = state.ball.y;
        
        // Update velocities (for smooth interpolation if you add it later)
        this.ball.dx = state.ball.dx;
        this.ball.dy = state.ball.dy;
        
        // Update paddles with scaling (only Y usually matters for Pong paddles)
        if (state.paddle1) {
            this.paddleLeft.y = state.paddle1.y;
        }
        if (state.paddle2) {
            this.paddleRight.y = state.paddle2.y;
        }
        
        // Update Scores
        if (state.score) {
             const newP1 = state.score.player1;
             const newP2 = state.score.player2;
             
             // Only emit if changed to avoid spam
             if (newP1 !== this.player1Score || newP2 !== this.player2Score) {
                 this.player1Score = newP1;
                 this.player2Score = newP2;
                 
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
        
        // Throttle input sends
        if (now - this.lastInputSent < this.inputThrottle) {
            return;
        }
        
        // Determine current input direction
        let direction: 'up' | 'down' | 'none' = 'none';
        
        if (this.playerSide === 'left') 
        {
            if (this.keys['w'])
            {
                direction = 'up';
                console.log(direction);
                this.paddleLeft.y += 10;
            }     
            else if (this.keys['s'])
            {

                direction = 'down';
                console.log(direction);
                this.paddleLeft.y -= 10;
            } 
        } 
        else     
        {
            if (this.keys['arrowup'])
            {
                direction = 'up';
                console.log(direction);
                this.paddleRight.y += 10;
            } 
            else if (this.keys['arrowdown']) 
            {
                direction = 'down';
                console.log(direction);
                this.paddleRight.y -= 10;
            }
        }
        
        // Optimization: Don't send 'none' if we just sent 'none' (optional)
        if (direction === 'none') {
        return;
    }
        
        // 3. FIXED SEND: Split into Type and Payload
        const sent = this.connection.send('game:input', {
            matchId: this.matchId,
            playerId: this.playerId,
            input: {
                direction,
            }
        });
        
        if (sent) {
            this.lastInputSent = now;
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
            matchId: this.matchId,
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    private render(): void 
    {
        this.ball.draw(this.ctx);
        this.paddleLeft.draw(this.ctx);
        this.paddleRight.draw(this.ctx);
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
            matchId: this.matchId,
            playerId: this.playerId
        });

       
        
        this.eventCallbacks = [];
    }
    
    // INPUT HANDLING
    private keydownHandler = (e: KeyboardEvent): void => 
    {
        const key = e.key.toLowerCase();
        this.keys[key] = true;
    };
    
    private keyupHandler = (e: KeyboardEvent): void => 
    {
        this.keys[e.key.toLowerCase()] = false;
    };
    
    private setupInputHandlers(): void 
    {
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }
    
    private removeInputHandlers(): void
    {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
    }
    
    private emitEvent(event: GameEvent): void 
    {
        this.eventCallbacks.forEach(callback => callback(event));
    }
}