import { Ball } from "./Ball";

//enemy ai for 2d
export class enemy 
{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    score: number;

    constructor(canvas: HTMLCanvasElement) 
    {
        this.width = 10;
        this.height = 100;
        this.x = canvas.width - this.width - 20; // right side
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 6;
        this.score = 0;
    }

    update(ball: Ball, canvas: HTMLCanvasElement) 
    {
        // Simple AI: follow the ball
        if(ball.dx > 0)
        {
            if (ball.y < this.y + this.height / 2) 
                this.y -= this.speed;
            if (ball.y > this.y + this.height / 2) 
                this.y += this.speed;
        }
        else 
        {
            const targetY = canvas.height / 2 - this.height / 2;
            if (this.y < targetY) this.y += this.speed / 2;
            else if (this.y > targetY) this.y -= this.speed / 2;
        }
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height)
            this.y = canvas.height - this.height;
    }

    draw(ctx: CanvasRenderingContext2D) 
    {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}