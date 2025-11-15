import { PADDLE_COLORS } from "../../pong3D/entities/PaddleColor";

//paddle for 2d
export class paddle
{
    x: number;                                                      //position on x
    y: number;                                                      //position on y
    width : number;                                                 //size
    height : number;                                                //size
    speed : number;                                                 //speed        
    directionY: number;                                             //direction on y
    color: string;
    
    constructor(side: "left" | "right", canvas: HTMLCanvasElement, colorKey: keyof typeof PADDLE_COLORS)
    {
        this.width = 10;
        this.height = 100;
        this.speed = 6;
        this.directionY = 0;
        this.x = 0;
        this.y = (canvas.height - this.height) /2;                  //Position on center of the screen
        
        const color = PADDLE_COLORS[colorKey];
        this.color = color.toHexString();

        if(side === 'left')                                         //if constructor called with left position left paddle
            this.x = 30;
        if(side === 'right')                                        //if constructor called with right position right paddle
            this.x = canvas.width - this.width - 30;
    }

    update(canvas: HTMLCanvasElement)                       
    {
        this.y += this.directionY * this.speed;                     //update position on y

        if(this.y < 0) this.y = 0;                                  //if on top off the screen
        if(this.y + this.height > canvas.height)                    //if on bottom part of the screen
            this.y = canvas.height - this.height;
    }

    draw(ctx: CanvasRenderingContext2D)
    {
        
        const baseColor = this.color;

        
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, `${baseColor}`);
        gradient.addColorStop(0.5, `${baseColor}aa`);  // semi-transparent mid tone
        gradient.addColorStop(1, `${baseColor}55`);   // fading glow bottom

        ctx.fillStyle = gradient;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 20;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0; 
    }
}