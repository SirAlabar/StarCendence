import { Ball } from "./entities/Ball"
import { paddle } from "./entities/Paddle";
import { player } from "./entities/Player";
import { navigateTo } from '@/router/router';


// PongScene.ts - main game engine



export class PongScene 
{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private ball:  Ball;
    private paddle_left : paddle;
    private paddle_right : paddle;
    private animationFrameId: number | null = null;
    private player1: player;
    private player2: player;
    private keys: { [key: string]: boolean } = {};
    private gamestate: boolean;
    
    
  
    constructor(ctx: CanvasRenderingContext2D) 
    {
        this.ctx = ctx;                     //get page and canvas
        this.canvas = ctx.canvas;
        this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
        this.paddle_left = new paddle("left" , this.canvas);
        this.paddle_right = new paddle("right", this.canvas);
        this.player1 = new player();
        this.player2 = new player();
        this.player1.score = 0;
        this.player2.score = 0;
        this.gamestate = false;
        this.InputHandler();
        
    }
    
    start():void
    {
        console.log("here")
        this.update();
    }   

    private update = ():void => 
    {
        if(this.gamestate == true)
            return;
        this.clear();
        this.updatePaddle();
        this.checkBallCollision(this.ball);
        this.drawScore();
        if(this.player1.score >= 3)
        {
            console.log("here?");
            console.log("Player 1 Won the game!");
            this.drawScore();
            this.endGame();
            return;
        }
        if(this.player2.score >= 3)
        {
            console.log("here?");
            console.log("Player 2 Won the game!");
            this.drawScore();
            this.endGame();
            return;
        }
        this.ball.draw(this.ctx);
        this.paddle_left.update(this.canvas);
        this.paddle_left.draw(this.ctx);
        this.paddle_right.update(this.canvas);
        this.paddle_right.draw(this.ctx);
        this.checkPaddleCollision(this.paddle_left);
        this.checkPaddleCollision(this.paddle_right);
        this.animationFrameId = requestAnimationFrame(this.update);
        
    };

    private clear() 
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    stop():void
    {
        if(this.animationFrameId)cancelAnimationFrame(this.animationFrameId);
    }

    private updatePaddle():void
    {
        //left paddle
        if(this.keys['ArrowUp'] && this.paddle_right.y > 0)
        {
            this.paddle_right.y -= this.paddle_right.speed;
        }
        if(this.keys['ArrowDown'] && this.paddle_right.y + this.paddle_right.height < this.canvas.height)
        {
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

    private checkPaddleCollision(paddle: paddle): void 
    {
        if (this.ball.x - this.ball.radius <= paddle.x + paddle.width &&
            this.ball.x + this.ball.radius >= paddle.x &&
            this.ball.y >= paddle.y &&
            this.ball.y <= paddle.y + paddle.height) 
        {
            this.ball.dx = this.ball.dx * -1.1;
            const hitPos = (this.ball.y - paddle.y) / paddle.height;
            this.ball.dy = (hitPos - 0.5) * 10;
            console.log("Velocity in X : ", this.ball.dx);
            console.log("Velocity in y : ", this.ball.dy);
        }
    }

    private checkBallCollision(ball : Ball, ): void
    {

        ball.x += ball.dx;
        ball.y += ball.dy;
        if (ball.x + ball.radius > this.canvas.width)                               //right side wall
        {
            this.stop();
            this.player1.score += 1;
            console.log("Player 1 Score: ", this.player1.score);
            this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
            this.ball.dx = -3;
            this.ball.dy = -3;
            
        }
        if(ball.x - ball.radius < 0)                                                // left side wall
        {
            this.stop();
            this.player2.score += 1;
            console.log("Player 2 Score: ", this.player2.score);
            this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
        }
        if (ball.y + ball.radius > this.canvas.height || ball.y - ball.radius < 0) //celling or floor
        {
            ball.dy = ball.dy  * (-1);
            console.log("Velocity in X : ", this.ball.dx);
            console.log("Velocity in y : ", this.ball.dy);
        }
    }

    private drawScore()
    {
        const ctx = this.ctx;
        ctx.fillStyle = "white";
        ctx.font = "48px 'Press Start To Play', monospace";
        ctx.textAlign = "center";

        if(this.player1.score == 3)
        {
            ctx.fillText("Player 1 Wins the game", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        if(this.player2.score == 3)
        {
            ctx.fillText("Player 2 Wins the game", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        //left player score
        ctx.fillText(`${this.player1.score}`, this.canvas.width / 4, 50);
        //right player score
        ctx.fillText(`${this.player2.score}`, (this.canvas.width / 4) * 3, 50);
    }

    private endGame()
    {
        this.gamestate = true;
        this.stop();
        setTimeout(() => {
            navigateTo("games");
        }, 2000);  
    }
}
  
