import { Ball } from "./entities/Ball"

export class PongScene
{
    private ctx: CanvasRenderingContext2D;
    private ball: Ball;
    private lastTime = 0;

    constructor(ctx: CanvasRenderingContext2D)
    {
        this.ctx = ctx;
        this.ball = new Ball(100, 100, 10);
    }
    start()
    {
        requestAnimationFrame(this.loop.bind(this));
    }
    private loop(time : number)
    {
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.update(delta);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }
    private update(delta: number)
    {
        this.ball.update(delta);
        //check all collision
        if(this.ball.x < 0 || this.ball.x > this.ctx.canvas.width)
        {
            this.ball.vx *= -1;
        }
        if(this.ball.y < 0 || this.ball.y > this.ctx.canvas.height)
        {
            this.ball.vy *= -1;
        }
    }
    private render()
    {
        this.ctx.clearRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ball.render(this.ctx);
    }
}