// EnemyAi.ts - Improved AI with ball prediction (1 second decision interval)

import { Ball } from "./Ball";

export type AiDifficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings 
{
    errorMargin: number;                        // How far off from perfect positioning
    missChance: number;                         // Probability of intentional miss (0-1)
    predictionAccuracy: number;                 // How accurate ball prediction is (0-1)
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

    // AI-specific properties
    private targetY: number;
    private difficulty: AiDifficulty;
    private settings: DifficultySettings;
    private shouldMiss: boolean = false;

    constructor(canvas: HTMLCanvasElement, difficulty: AiDifficulty = 'medium') 
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
                    errorMargin: 20,
                    missChance: 0.15,
                    predictionAccuracy: 0.7
                };
            case 'medium':
                return {
                    errorMargin: 15,
                    missChance: 0.10,
                    predictionAccuracy: 0.8
                };
            case 'hard':
                return {
                    errorMargin: 10,
                    missChance: 0.05,
                    predictionAccuracy: 0.9
                };
        }
    }

    makeDecision(ball: Ball, canvasHeight: number): 'up' | 'down' | 'stay' 
    {
        // Random chance to intentionally miss
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

        // Add error margin (imperfect positioning)
        const error = (Math.random() - 0.5) * this.settings.errorMargin;
        this.targetY += error;

        // Clamp target to canvas bounds
        this.targetY = Math.max(this.height / 2, Math.min(canvasHeight - this.height / 2, this.targetY));

        // Return movement decision
        return this.getMovementDirection();
    }

    

    private predictBallPosition(ball: Ball, canvasHeight: number): number {
        
        // Only predict if ball is moving towards the AI paddle
        if (ball.dx <= 0) 
            return canvasHeight / 2;

        // Calculate time until ball reaches paddle
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
            
            // Stop if we've reached the paddle
            if (simX >= this.x) 
                break;
        }
        
        simY = Math.max(0, Math.min(canvasHeight, simY));
        const accuracyFactor = this.settings.predictionAccuracy;
        const predictedY = ball.y + (simY - ball.y) * accuracyFactor;

        return predictedY;
    }

    private getRandomMissPosition(canvasHeight: number): number {
        // Generate a position that will likely cause a miss
        const edgeZone = this.height;
        if (Math.random() < 0.5) 
            return Math.random() * edgeZone; // Top edge
        else 
            return canvasHeight - Math.random() * edgeZone; // Bottom edge
    }

    private getMovementDirection(): 'up' | 'down' | 'stay' 
    {
        const paddleCenter = this.y + this.height / 2;
        const deadzone = 15; // Small area where AI doesn't move

        if (this.targetY < paddleCenter - deadzone) 
            return 'up';
        else if (this.targetY > paddleCenter + deadzone) 
            return 'down';
        else 
            return 'stay';
    }

    // Movement executed every frame
    move(canvasHeight: number): void 
    {
            const centerY = this.y + this.height / 2;
            const threshold = 10; // Smaller = more responsive

        // Adjust continuously toward targetY instead of fixed direction
        if (Math.abs(this.targetY - centerY) > threshold) 
            if (this.targetY < centerY) 
                this.y -= this.speed;
            else if (this.targetY > centerY) 
                this.y += this.speed;

        // Keep within bounds
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvasHeight)
            this.y = canvasHeight - this.height;
    }   


    draw(ctx: CanvasRenderingContext2D): void 
    {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

}