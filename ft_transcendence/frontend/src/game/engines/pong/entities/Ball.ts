import { Entity } from "./Entity.js";

export class Ball extends Entity
{
    vx:     number;
    vy:     number;
    radius: number;

    constructor(x: number, y:number, radius:number)
    {
        super(x, y);
        this.vx = 150;
        this.vy = 150;
        this.radius = radius;
    }

    update(delta: number): void
    {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
    }
    render(ctx: CanvasRenderingContext2D): void
    {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }
}