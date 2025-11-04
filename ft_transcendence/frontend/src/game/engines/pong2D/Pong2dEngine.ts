import { GameState, GameConfig, GameEvent } from "../../utils/GameTypes";
import { Ball } from "./entities/Ball";
import { paddle } from "./entities/Paddle";
import { player } from "./entities/Player";
import { enemy } from "./entities/EnemyAi";


export class LocalPongEngine
{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    //Game Objects
    private ball: Ball;
    private paddleleft: paddle;
    private paddleright: paddle;
    private player1: player;
    
    private player2?: player;
    private enemy?: enemy;

    //Game State
    private animationFrameId: number | null = null;
    private paused: boolean = false;
    private ended: boolean = false;
    private keys: {[key:string]: boolean} = {};

    //Configs
    private config: GameConfig;
    
    //Events
    private eventCallBack: Array<(event: GameEvent) => void> = [];

    //ai
    private aiDecisionInterval: number = 1000;
    private lastAiDecisionTime: number = 0;

    constructor(canvas: HTMLCanvasElement, config: GameConfig)
    {
        this.canvas = canvas;
        this.config = config;
        

        const ctx = canvas.getContext("2d");
        if(!ctx)
            throw Error("Failed to get 2d Context");
        this.ctx = ctx;

        //start game objects
        this.ball = new Ball(canvas.width/2, canvas.height/2, 10);
        this.ball.dx = 3;
        this.ball.dy = 1;

        //create paddles
        const paddle1color = config.paddlecolor1 || 'default';
        const paddle2color = config.paddlecolor2 || 'default';
        this.paddleleft = new paddle("left", canvas, paddle1color);
        this.paddleright = new paddle("right", canvas, paddle2color);

        this.player1 = new player();
        this.player1.score = 0;
        

        //configs
        if(config.mode === 'local-multiplayer')
        {
            this.player2 = new player();
            this.player2.score = 0;
        }
        else if(config.mode === 'ai')
        {
            this.enemy = new enemy(canvas, config.difficulty || 'easy');
            this.enemy.score = 0;
        }

        //input handling
        this.setupInputHandlers();
        console.log('Local Pong Engine', config);

    }

    start(): void
    {
        if(this.paused)
            this.paused = false;

        if(this.config.mode === 'ai' && this.enemy)
        {
            this.lastAiDecisionTime = Date.now() - this.aiDecisionInterval;
        }
        
        this.emitEvent({type: 'game-started'});
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
        this.emitEvent({type: 'game-paused'})
        this.drawPauseOverlay();
    }

    resume():void
    {
        this.paused = false;
        this.emitEvent({type: 'game-resumed'});
        this.update();
    }


    getState(): GameState {
        return {
            ball: 
            {
                x: this.ball.x,
                y: this.ball.y,
                dx: this.ball.dx,
                dy: this.ball.dy,
                radius: this.ball.radius
            },
            paddle1: 
            {
                x: this.paddleleft.x,
                y: this.paddleleft.y,
                width: this.paddleleft.width,
                height: this.paddleleft.height,
                color: this.config.paddlecolor1 || 'default'
            },
            paddle2: 
            {
                x: this.paddleright.x,
                y: this.paddleright.y,
                width: this.paddleright.width,
                height: this.paddleright.height,
                color: this.config.paddlecolor2 || 'default'
            },
            scores: 
            {
                player1: this.player1.score,
                player2: this.player2?.score || this.enemy?.score || 0
            },
            timestamp: Date.now()
        };
    }

    onEvent(callback: (event: GameEvent) => void): void
    {
        this.eventCallBack.push(callback);
    }

    destroy(): void
    {
        this.stop;
        this.removeInputHandlers();
        this.eventCallBack = [];
    }

    private update = (): void =>
    {
        if(this.ended || this.paused)
            return;

        //clear and update frame
        this.clear();
        this.updatePaddles();
        this.updateBall();
        this.checkCollisions();
        this.render();

        if (this.player1.score >= 3 || 
            (this.player2 && this.player2.score >= 3) || 
            (this.enemy && this.enemy.score >= 3)) 
            {
                this.handleGameEnd();
                return;
            }
        this.animationFrameId = requestAnimationFrame(this.update);
    };
    
    private updateBall(): void 
    {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        const pulse = Math.sin(Date.now() / 200) * 2;
        this.ball.radius = 15 + pulse;
        
        // Top/bottom wall collision
        if (this.ball.y + this.ball.radius > this.canvas.height || 
            this.ball.y - this.ball.radius < 0) 
        {
            this.ball.dy *= -1;
            this.emitEvent({ type: 'wall-hit' });
        }
    }
    
    private updatePaddles(): void 
    {
        const speed = this.paddleleft.speed;
        
        // Player 1 (left paddle)
        if (this.keys['w'] && this.paddleleft.y > 0) 
        {
            this.paddleleft.y -= speed;
        }
        if (this.keys['s'] && this.paddleleft.y + this.paddleleft.height < this.canvas.height) 
        {
            this.paddleleft.y += speed;
        }
        
        // Player 2 / AI (right paddle)
        if (this.config.mode === 'local-multiplayer') 
        {
            if (this.keys['8'] && this.paddleright.y > 0) 
            {
                this.paddleright.y -= speed;
            }
            if (this.keys['2'] && this.paddleright.y + this.paddleright.height < this.canvas.height) 
            {
                this.paddleright.y += speed;
            }
        } 
        else if (this.config.mode === 'ai' && this.enemy) 
        {
            this.updateAI();
        }
    }
    
    private updateAI(): void 
    {
        if (!this.enemy) return;
        
        const now = Date.now();
        if (now - this.lastAiDecisionTime >= this.aiDecisionInterval) 
        {
            this.lastAiDecisionTime = now;
            this.enemy.makeDecision(this.ball, this.canvas.width);
        }
        this.enemy.move(this.canvas.height);
    }
    
    private checkCollisions(): void 
    {
        // Paddle collisions
        this.checkPaddleCollision(this.paddleleft, 'left');
        this.checkPaddleCollision(this.paddleright, 'right');
        if(this.enemy)
            this.checkPaddleCollision(this.enemy, 'right');
        
        // Goal detection
        if (this.ball.x + this.ball.radius > this.canvas.width) 
        {
            this.handleGoal('player1');
        }
        
        if (this.ball.x - this.ball.radius < 0) 
        {
            this.handleGoal('player2');
        }
    }
    
    private checkPaddleCollision(paddle: paddle | enemy, side: 'left' | 'right'): void 
    {
        if (this.ball.x - this.ball.radius <= paddle.x + paddle.width && this.ball.x + this.ball.radius >= paddle.x &&
            this.ball.y >= paddle.y && this.ball.y <= paddle.y + paddle.height) 
        {
            const speedIncrease = 1.10;
            this.ball.dx = -this.ball.dx * speedIncrease;
            
            const relativeIntersectY = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            this.ball.dy += relativeIntersectY * 4;
            
            // Limit max speed
            const maxSpeed = 15;
            const currentSpeed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
            if (currentSpeed > maxSpeed) 
            {
                const scale = maxSpeed / currentSpeed;
                this.ball.dx *= scale;
                this.ball.dy *= scale;
            }
            
            this.emitEvent({ type: 'paddle-hit', paddle: side });
        }
    }
    
    private handleGoal(scorer: 'player1' | 'player2'): void 
    {
        this.stop();
        
        if (scorer === 'player1') 
        {
            this.player1.score += 1;
        } 
        else 
        {
            if (this.player2) 
            {
                this.player2.score += 1;
            } 
            else if (this.enemy) 
            {
                this.enemy.score += 1;
            }
        }
        
        this.emitEvent({ type: 'goal-scored', scorer });
        
        // Reset ball
        const direction = scorer === 'player1' ? -3 : 3;
        this.resetBall(direction, Math.random() > 0.5 ? 1 : -1);
        this.resetPaddles();
        
        // Resume after delay
        setTimeout(() => {
            if (!this.ended) {
                this.start();
            }
        }, 1000);
    }
    
    private handleGameEnd(): void 
    {
        this.ended = true;
        this.stop();
        
        const winner = this.player1.score >= 3 ? 'player1' : 'player2';
        this.emitEvent({ type: 'game-ended', winner });
    }
    
    private resetBall(dx: number, dy: number): void 
    {
        this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2, 10);
        this.ball.dx = dx;
        this.ball.dy = dy;
    }
    
    private resetPaddles(): void 
    {
        this.paddleleft.x = 20;
        this.paddleleft.y = this.canvas.height / 2 - this.paddleleft.height / 2;
        
        this.paddleright.x = this.canvas.width - this.paddleright.width - 20;
        this.paddleright.y = this.canvas.height / 2 - this.paddleright.height / 2;
    }
    
    
    private clear(): void 
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    private render(): void 
    {
        // Draw score
        this.drawScore();
        
        // Draw game objects
        this.ball.draw(this.ctx);
        this.paddleleft.draw(this.ctx);
        
        if (this.config.mode === 'local-multiplayer') 
        {
            this.paddleright.draw(this.ctx);
        } 
        else if (this.enemy) 
        {
            this.enemy.draw(this.ctx);
        }
        
    }
    
    private drawScore(): void 
    {
        this.ctx.fillStyle = "white";
        this.ctx.font = "48px 'Press Start To Play', monospace";
        this.ctx.textAlign = "center";
        
        this.ctx.fillText(`${this.player1.score}`, this.canvas.width / 4, 50);
        
        const score2 = this.player2?.score || this.enemy?.score || 0;
        this.ctx.fillText(`${score2}`, (this.canvas.width / 4) * 3, 50);
    }
    
    private drawPauseOverlay(): void 
    {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = "white";
        this.ctx.font = "48px 'Press Start To Play', monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }
    
  
    
    private keydownHandler = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = true;
    };
    
    private keyupHandler = (e: KeyboardEvent) => {
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
        this.eventCallBack.forEach(callback => callback(event));
    }
    

    
    public resize(newWidth: number, newHeight: number): void 
    {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        const widthRatio = newWidth / oldWidth;
        const heightRatio = newHeight / oldHeight;
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // Scale all positions
        this.ball.x *= widthRatio;
        this.ball.y *= heightRatio;
        
        this.paddleleft.x *= widthRatio;
        this.paddleleft.y *= heightRatio;
        
        this.paddleright.x *= widthRatio;
        this.paddleright.y *= heightRatio;
        
        this.ball.dx *= widthRatio;
        this.ball.dy *= heightRatio;
    }
    

}