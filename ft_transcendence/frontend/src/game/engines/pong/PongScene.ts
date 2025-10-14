import { Ball } from "./entities/Ball"
import { paddle } from "./entities/Paddle";
import { player } from "./entities/Player";
import { enemy } from "./entities/EnemyAi";

// PongScene.ts - main game engine
//pong 2d


export class PongScene 
{
    private ctx: CanvasRenderingContext2D;                  //page
    private canvas: HTMLCanvasElement;                      //canvas
    private ball:  Ball;                                    //game ball
    private paddle_left! : paddle;                          //paddles
    private paddle_right! : paddle;
    private animationFrameId: number | null = null;         //frames
    private player1!: player;                               //players
    private player2!: player;
    private enemy!: enemy;                                  //enemy ai
    private keys: { [key: string]: boolean } = {};          //keys (w,s arrowup, arrowdown)
    private mode?: "multiplayer" | "ai";                    //mode , multiplayer or enemyai
    private gamestate: boolean;                             //game state (true game ended)
    private paused : boolean
    private aiDecisionInterval: number = 1000;
    private lastAiDecisionTime: number = 0;
        
    constructor(ctx: CanvasRenderingContext2D, mode: "multiplayer" | "ai") 
    {
        this.ctx = ctx;
        this.paused = false;
        this.canvas = ctx.canvas;
        this.mode = mode;
        this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
        this.ball.dx = 3;
        this.ball.dy = 3;
        this.paddle_left = new paddle("left" , this.canvas);
        this.lastAiDecisionTime = Date.now() - this.aiDecisionInterval;

        if (mode === "multiplayer") 
        {
            this.paddle_right = new paddle("right", this.canvas);
            this.player1 = new player();
            this.player2 = new player();
            this.player1.score = 0;
            this.player2.score = 0;
        } 
        else 
        { 
            this.enemy = new enemy(this.canvas); 
            this.player1 = new player();
            this.player1.score = 0;
            this.enemy.score = 0;
        }

        this.gamestate = false;
        this.InputHandler();
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'p') {
                this.togglePause();
            }
        });
    }
    
    start():void
    {
        //update every frame
        if(this.paused)
            this.paused = false; //unpause
        if (this.mode === "ai" && this.enemy) 
        {
            this.aiMovement(true); // pass true = force decision
        }
        this.update();
    }   

   private update = (): void => 
    {
        if (this.gamestate || this.paused) 
            return;
        this.updateFrame();
        if (this.player1.score >= 3 || (this.mode === "multiplayer" && this.player2.score >= 3) || (this.mode === "ai" && this.enemy.score >= 3)) 
        {
            const winner = this.player1.score >= 3 ? "Player 1" : "Opponent";
            console.log(`${winner} won the game!`);
            this.drawScore();
            this.endGame();
            return;
        }
        this.updateBallPaddle();
        if (this.mode === "multiplayer" && this.paddle_right) 
        {
            this.paddle_right.update(this.canvas);
            this.paddle_right.draw(this.ctx);
            this.checkPaddleCollision(this.paddle_right);
        } 
        else if (this.mode === "ai" && this.enemy) 
        {
            //this.enemy.update(this.ball, this.canvas);
            this.enemy.draw(this.ctx);
            this.checkPaddleCollision(this.enemy);
        }
        this.checkPaddleCollision(this.paddle_left);
        this.animationFrameId = requestAnimationFrame(this.update);
    };

    private clear() 
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private updateFrame()
    {
        this.clear();
        this.updatePaddle();
        this.checkBallCollision(this.ball);
        this.drawScore();
    }

    private updateBallPaddle()
    {
        this.ball.draw(this.ctx);
        this.paddle_left.update(this.canvas);
        this.paddle_left.draw(this.ctx);
    }

    stop():void
    {
        if(this.animationFrameId)
        {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.paused = true;
    }

    private updatePaddle():void
    {
        //left paddle
        if(this.mode === "multiplayer")
        {
            if(this.keys['ArrowUp'] && this.paddle_right.y > 0)
                this.paddle_right.y -= this.paddle_right.speed;
            if(this.keys['ArrowDown'] && this.paddle_right.y + this.paddle_right.height < this.canvas.height)
                this.paddle_right.y += this.paddle_right.speed;
        }
        //right paddle
        if(this.keys['w'] && this.paddle_left.y > 0)
        {
            
            this.paddle_left.y -= this.paddle_left.speed;
        }
        if(this.keys['s'] && this.paddle_left.y + this.paddle_left.height < this.canvas.height)
        {
                this.paddle_left.y += this.paddle_left.speed;
        }
        if (this.mode === "ai" && this.enemy) 
        {
            this.aiMovement()
        }
    }

    private aiMovement(atstart: boolean = false)
    {
        const now = Date.now();

        if (atstart || now - this.lastAiDecisionTime > this.aiDecisionInterval) 
        {
            this.lastAiDecisionTime = now;
            this.keys['ArrowUp'] = false;
            this.keys['ArrowDown'] = false;

            const ball = this.ball;
            const paddleCenter = this.enemy.y + this.enemy.height / 2;

            if (ball.y < paddleCenter - 20)
                this.keys['ArrowUp'] = true;
            else if (ball.y > paddleCenter + 20)
                this.keys['ArrowDown'] = true;
        }
        if (this.keys['ArrowUp'] && this.enemy.y > 0)
            this.enemy.y -= this.enemy.speed;
        if (this.keys['ArrowDown'] && this.enemy.y + this.enemy.height < this.canvas.height)
            this.enemy.y += this.enemy.speed;
    }

    private InputHandler():void
    {
        window.addEventListener('keydown', (e)=>
        {
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e)=>
        {
            this.keys[e.key] = false;
        });
    }

    private checkPaddleCollision(paddle: paddle | enemy): void 
    {
        if (
            this.ball.x - this.ball.radius <= paddle.x + paddle.width &&
            this.ball.x + this.ball.radius >= paddle.x &&
            this.ball.y >= paddle.y &&
            this.ball.y <= paddle.y + paddle.height
        ) 
        {
            const speedIncrease = 1.10; 
            this.ball.dx = -this.ball.dx * speedIncrease;
            const relativeIntersectY = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            this.ball.dy += relativeIntersectY * 4;
            const maxSpeed = 15;
            const currentSpeed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
            if (currentSpeed > maxSpeed) 
            {
                const scale = maxSpeed / currentSpeed;
                this.ball.dx *= scale;
                this.ball.dy *= scale;
            }
            console.log(`Hit paddle at ${relativeIntersectY.toFixed(2)} → dx=${this.ball.dx}, dy=${this.ball.dy}`);
        }
    }

    private checkBallCollision(ball: Ball): void 
    {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x + ball.radius > this.canvas.width) 
        {
            // Right wall hit
            this.stop();
            this.player1.score += 1;
            this.resetBall(-3, -3);
            this.resetPlayer();
        }

        if (ball.x - ball.radius < 0) 
        {
            // Left wall hit
            this.stop();
            if (this.mode === "multiplayer") 
            {
                this.player2.score += 1;
                this.resetBall(3, 3);
                this.resetPlayer();
            } 
            else if (this.mode === "ai" && this.enemy) 
            {
                this.enemy.score += 1;
                this.resetBall(5, 5);
                this.resetPlayer();
            }
        }

        if (ball.y + ball.radius > this.canvas.height || ball.y - ball.radius < 0) 
        {
            ball.dy *= -1;
        }
    }

    private resetBall(dx: number, dy: number) 
    {
        this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2, 10);
        this.ball.dx = dx;
        this.ball.dy = dy;
    }

    private resetPlayer()
    {
        if (this.paddle_left) 
        {
            this.paddle_left.x = 20;
            this.paddle_left.y = this.canvas.height / 2 - this.paddle_left.height / 2;
        }
        if (this.mode === "multiplayer" && this.paddle_right) 
        {
            this.paddle_right.x = this.canvas.width - this.paddle_right.width - 20;
            this.paddle_right.y = this.canvas.height / 2 - this.paddle_right.height / 2;
        } 
        else if (this.mode === "ai" && this.enemy) 
        {
            this.enemy.x = this.canvas.width - this.enemy.width - 20;
            this.enemy.y = this.canvas.height / 2 - this.enemy.height / 2;
        }
    }

    private drawScore()
    {
        const ctx = this.ctx;
        ctx.fillStyle = "white";
        ctx.font = "48px 'Press Start To Play', monospace";
        ctx.textAlign = "center";

        // Win messages depending on mode
        if (this.player1 && this.player1.score === 3) 
        {
            ctx.fillText("Player 1 Wins the game", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        if (this.mode === "multiplayer" && this.player2 && this.player2.score === 3)     
        {
            ctx.fillText("Player 2 Wins the game", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        if (this.mode === "ai" && this.enemy && this.enemy.score === 3) 
        {
            ctx.fillText("Bot John Wins the game", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        ctx.fillText(`${this.player1?.score ?? 0}`, this.canvas.width / 4, 50);
        if (this.mode === "multiplayer") 
        {
            ctx.fillText(`${this.player2?.score ?? 0}`, (this.canvas.width / 4) * 3, 50);
        } 
        else if (this.mode === "ai") 
        {
            ctx.fillText(`${this.enemy?.score ?? 0}`, (this.canvas.width / 4) * 3, 50);
        }
    }

    private endGame()
    {
        this.gamestate = true;
        this.stop();
        setTimeout(() => 
        {
            window.location.href = '/games';
        }, 2000);  
    }

    togglePause(): void 
    {
        this.paused = !this.paused;
        if (!this.paused)
            this.update(); 
        else 
            this.drawPauseOverlay();
    }

    private drawPauseOverlay() 
    {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = "white";
        this.ctx.font = "48px 'Press Start To Play', monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Paused", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }
}

