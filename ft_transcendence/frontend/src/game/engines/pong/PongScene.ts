import { Ball } from "./entities/Ball"
import { paddle } from "./entities/Paddle";


// PongScene.ts - main game engine



export class PongScene 
{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private ball:  Ball;
    private paddle_left : paddle;
    private paddle_right : paddle;
    private animationFrameId: number | null = null;
    private keys: { [key: string]: boolean } = {};
    
  
    constructor(ctx: CanvasRenderingContext2D) 
    {
        this.ctx = ctx;                     //get page and canvas
        this.canvas = ctx.canvas;
        this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
        this.paddle_left = new paddle("left" , this.canvas);
        this.paddle_right = new paddle("right", this.canvas);
        this.InputHandler();
    }
    
    start():void
    {
        console.log("here")
        this.update();
    }   

    private update = ():void => 
    {
        this.clear();
        this.updatePaddle();
        this.checkBallCollision(this.ball);
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
        //right paddle
        if(this.keys['ArrowUp'] && this.paddle_right.y > 0)
        {
            this.paddle_right.y -= this.paddle_right.speed;
        }
        if(this.keys['ArrowDown'] && this.paddle_right.y + this.paddle_right.height < this.canvas.height)
        {
            this.paddle_right.y += this.paddle_right.speed;
        }
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
            this.ball.dx *= -1.1;
            const hitPos = (this.ball.y - paddle.y) / paddle.height;
            this.ball.dy = (hitPos - 0.5) * 10;
            
        }
    }

    private checkBallCollision(ball : Ball, ): void
    {

        ball.x += ball.dx;
        ball.y += ball.dy;
        if (ball.x + ball.radius > this.canvas.width) 
        {
            console.log("Hit the right side");
            this.stop();
            this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
            
        }
        if(ball.x - ball.radius < 0)
        {
            console.log("Hit the left side");
            this.stop();
            this.ball = new Ball(this.canvas.width /2 , this.canvas.height /2 , 10);
        }
        if (ball.y + ball.radius > this.canvas.height || ball.y - ball.radius < 0) 
        {
            ball.dy *= -1;
        }
    }

}
  
