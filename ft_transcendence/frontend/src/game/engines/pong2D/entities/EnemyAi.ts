import { Ball } from "./Ball";

export type AiDifficulty = 'easy' | 'hard';

interface DifficultySettings 
{
    errorMargin: number;                        
    missChance: number;                         
    predictionAccuracy: number;                 
}

export class enemy 
{
    x: number;
    y: number;
    width: number = 10;
    height: number = 100;
    speed: number = 5;
    score: number = 0;
    color: string = "red";

  
    private targetY: number;
    private difficulty: AiDifficulty;
    private settings: DifficultySettings;
    private shouldMiss: boolean = false;

    constructor(canvas: HTMLCanvasElement, difficulty: AiDifficulty = 'easy') 
    {
        this.x = canvas.width - this.width - 20;
        this.y = canvas.height / 2 - this.height / 2;
        this.targetY = this.y;
        this.difficulty = difficulty;
        this.settings = this.getDifficultySettings(difficulty);
        console.log("AI Difficulty:", this.difficulty);
    }

    private getDifficultySettings(difficulty: AiDifficulty): DifficultySettings 
    {
        switch(difficulty) {
            case 'easy':
                return {
                    errorMargin: 5,
                    missChance: 0.01,
                    predictionAccuracy: 0.9
                };
            case 'hard':
                return {
                    errorMargin: 0,
                    missChance: 0.00,
                    predictionAccuracy: 1
                };
        }
    }

    makeDecision(ball: Ball, canvasHeight: number): 'up' | 'down' | 'stay' 
    {
        if (Math.random() < this.settings.missChance) 
        {
            console.log("AI will miss", this.shouldMiss);
            this.shouldMiss = true;
            this.targetY = this.getRandomMissPosition(canvasHeight);
        }
        else 
        {
            this.shouldMiss = false;
            this.targetY = this.predictBallPosition(ball, canvasHeight);
        }
        const error = (Math.random() - 0.5) * this.settings.errorMargin;
        this.targetY += error;
        this.targetY = Math.max(this.height / 2, Math.min(canvasHeight - this.height / 2, this.targetY));
        return this.getMovementDirection();
    }

    

    private predictBallPosition(ball: Ball, canvasHeight: number): number {
        
       
        if (ball.dx <= 0) 
            return canvasHeight / 2;

        const distanceToTravel = this.x - ball.x;
        if (distanceToTravel <= 0) 
            return ball.y;

        const timeToReach = distanceToTravel / Math.abs(ball.dx);
        let simX = ball.x;
        let simY = ball.y;
        let simDx = ball.dx;
        let simDy = ball.dy;
        const steps = Math.ceil(timeToReach);
        const stepSize = timeToReach / steps;
        
        for (let i = 0; i < steps; i++) 
        {
            simX += simDx * stepSize;
            simY += simDy * stepSize;
            
            // Check for top/bottom wall collisions
            if (simY < 0) 
            {
                simY = -simY;                       // Reflect position
                simDy = Math.abs(simDy);            // Reverse direction (going down now)
            } 
            else if (simY > canvasHeight) 
            {
                simY = 2 * canvasHeight - simY;     // Reflect position
                simDy = -Math.abs(simDy);           // Reverse direction (going up now)
            }
            
            if (simX >= this.x) 
                break;
        }
        
        simY = Math.max(0, Math.min(canvasHeight, simY));
        const accuracyFactor = this.settings.predictionAccuracy;
        const predictedY = ball.y + (simY - ball.y) * accuracyFactor;

        return predictedY;
    }

    private getRandomMissPosition(canvasHeight: number): number 
    {
        const edgeZone = this.height;
        if (Math.random() < 0.5) 
            return Math.random() * edgeZone; // Top edge
        else 
            return canvasHeight - Math.random() * edgeZone; // Bottom edge
    }

    private getMovementDirection(): 'up' | 'down' | 'stay' 
    {
        const paddleCenter = this.y + this.height / 2;
        const deadzone = 15;

        if (this.targetY < paddleCenter - deadzone) 
            return 'up';
        else if (this.targetY > paddleCenter + deadzone) 
            return 'down';
        else 
            return 'stay';
    }


    move(canvasHeight: number): void 
    {
        const centerY = this.y + this.height / 2;
        const distance = Math.abs(this.targetY - centerY);

      
        const speedBoost = Math.min(distance / 15, 4);
        const effectiveSpeed = this.speed + speedBoost;

        if (this.targetY < centerY - 5) 
            this.y -= effectiveSpeed;
        else if (this.targetY > centerY + 5) 
            this.y += effectiveSpeed;

        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvasHeight)
            this.y = canvasHeight - this.height;
    } 


    draw(ctx: CanvasRenderingContext2D): void 
    {
            
            let color = this.color.startsWith('#') ? this.color : '#ff0000';
            const t = Date.now() / 300;
            const pulse = (Math.sin(t) + 1) / 2; 
            const glow = 10 + pulse * 15;
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, `${color}aa`);
            gradient.addColorStop(1, `${color}33`);
            ctx.shadowColor = color;
            ctx.shadowBlur = glow;
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
    }

}