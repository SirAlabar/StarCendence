import { GameConfig, GameState, GameEvent, GameEngine } from "../../utils/GameTypes";
import { IOnlineGameConnection, OutgoingGameMessage, OGameStateUpdate, OGameEvent } from "@/game/utils/OnlineInterface";
import { Ball } from "./entities/Ball";
import { paddle } from "./entities/Paddle";

export class OnlinePongEngine implements GameEngine 
{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    
    // Game objects 
    private ball: Ball;
    private paddleLeft: paddle;
    private paddleRight: paddle;
    
    // Network
    private connection: IOnlineGameConnection;   
    private matchId: string;
    private playerId: string;
    private playerSide: 'left' | 'right';
    
    // State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: {[key: string]: boolean} = {};
    
    // Input throttling
    private lastInputSent: number = 0;
    private inputThrottle: number = 50; // ms
    
    // Scores
    private player1Score: number = 0;
    private player2Score: number = 0;
    
    // Events
    private eventCallbacks: Array<(event: GameEvent) => void> = [];
    
    constructor(canvas: HTMLCanvasElement, config: GameConfig, connection: IOnlineGameConnection, matchId: string, playerId: string, playerSide: 'left' | 'right') 
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
        this.setupNetworkListeners();       //listens for state and game event payloads
        this.setupInputHandlers();          //key detection
        
        console.log(matchId,playerId,playerSide);
    }
    
   
    // NETWORK SETUP
    
    
    private setupNetworkListeners(): void {
        // Listen for state updates from server
        this.connection.on('game:state', (data: OGameStateUpdate['payload']) => 
        {
            if (data.matchId !== this.matchId) 
                return;
            
            console.log('Received state update', data);
            this.applyServerState(data.state);
        });
        
        // Listen for game events
        this.connection.on('game:event', (data: OGameEvent['payload']) => 
        {
            if (data.matchId !== this.matchId) return;
            
            console.log('Received game event', data.event);
            this.handleServerEvent(data.event);
        });
    }
    
    private applyServerState(state: OGameStateUpdate['payload']['state']): void 
    {
        // Update ball
        this.ball.x = state.ball.x;
        this.ball.y = state.ball.y;
        this.ball.dx = state.ball.dx;
        this.ball.dy = state.ball.dy;
        this.ball.radius = state.ball.radius;
        
        // Update paddles
        this.paddleLeft.x = state.paddle1.x;
        this.paddleLeft.y = state.paddle1.y;
        this.paddleLeft.width = state.paddle1.width;
        this.paddleLeft.height = state.paddle1.height;
        
        this.paddleRight.x = state.paddle2.x;
        this.paddleRight.y = state.paddle2.y;
        this.paddleRight.width = state.paddle2.width;
        this.paddleRight.height = state.paddle2.height;
        
        // Update scores
        this.player1Score = state.scores.player1;
        this.player2Score = state.scores.player2;
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
        
        // Also emit score updates
        this.emitEvent
        ({
            type: 'score-updated',
            player1Score: this.player1Score,
            player2Score: this.player2Score
        });
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
                direction = 'up';
            else if (this.keys['s']) 
                direction = 'down';
        } else {
            if (this.keys['arrowup']) 
                direction = 'up';
            else if (this.keys['arrowdown']) 
                direction = 'down';
        }
        
        // Create message
        const message: OutgoingGameMessage = 
        {
            type: 'game:input',
            payload: {
                matchId: this.matchId,
                playerId: this.playerId,
                input: {
                    direction,
                }
            }
        };
        
        // Send via connection
        const sent = this.connection.send(message);
        
        if (sent) 
        {
            this.lastInputSent = now;
            console.log('Sent input:', direction);
        }
        else 
        {
            console.warn('Failed to send input');
        }
    }
    
    // GAME LOOP 
    
    start(): void 
    {
        if (this.paused) 
            this.paused = false;
        
        // Tell websocket we're ready
        const readyMessage: OutgoingGameMessage = 
        {
            type: 'game:ready',
            payload: {
                matchId: this.matchId,
                playerId: this.playerId
            }
        };
        this.connection.send(readyMessage);   ///send message
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
            ball: 
            {
                x: this.ball.x,
                y: this.ball.y,
                dx: this.ball.dx,
                dy: this.ball.dy,
              
            },
            paddle1: 
            {
                x: this.paddleLeft.x,
                y: this.paddleLeft.y,
               
            },
            paddle2: 
            {
                x: this.paddleRight.x,
                y: this.paddleRight.y,
                
            },
            scores: 
            {
                player1: this.player1Score,
                player2: this.player2Score
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
        
        const leaveMessage: OutgoingGameMessage = 
        {
            type: 'game:leave',
            payload: 
            {
                matchId: this.matchId,
                playerId: this.playerId
            }
        };
        this.connection.send(leaveMessage);
        this.connection.off('game:state', () => {});
        this.connection.off('game:event', () => {});
        
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