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
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.1, this.x, this.y, this.radius);
            gradient.addColorStop(0, "#00ffff");
            gradient.addColorStop(0.5, "#0077ff");
            gradient.addColorStop(1, "rgba(0, 0, 80, 0.1");

            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
      }
  

}