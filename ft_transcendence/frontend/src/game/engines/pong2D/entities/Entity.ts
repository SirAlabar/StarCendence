// Base entity class

export abstract class Entity
{
    x: number;
    y: number;

    constructor(x: number, y:number)
    {
        this.x = x;
        this.y = y;
    }

    abstract update(delta:number):void;
    abstract render(ctx:CanvasRenderingContext2D): void;
}
