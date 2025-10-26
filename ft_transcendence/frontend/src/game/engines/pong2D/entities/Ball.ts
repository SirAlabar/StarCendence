//ball 2d
export class Ball 
{
        x: number;
        y: number;
        radius: number;
        dx: number;
        dy: number;

  constructor(x: number, y: number, radius: number) 
  {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = 5;          // velocity x
        this.dy = 5;          // velocity y
  }

  draw(ctx: CanvasRenderingContext2D) 
  {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
  }
  

}