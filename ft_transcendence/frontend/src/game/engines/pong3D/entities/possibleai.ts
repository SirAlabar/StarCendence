/*
import * as BABYLON from "@babylonjs/core";

export type AiDifficulty3D = 'easy' | 'hard';

interface DifficultySettings 
{
    reactionTime: number;           // Time between AI "observations" (ms)
    predictionAccuracy: number;     // How accurate physics prediction is (0-1)
    errorMargin: number;            // Random positioning error
    missChance: number;             // Probability of intentional miss
    responseDelay: number;          // Delay before reacting to prediction (ms)
}

interface BallSnapshot 
{
    position: BABYLON.Vector3;
    velocity: BABYLON.Vector3;
    timestamp: number;
}

export class Enemy3D
{
    private difficulty: AiDifficulty3D;
    private settings: DifficultySettings;
    private paddle: BABYLON.Mesh;
    private ball: BABYLON.Mesh;
    
    // AI state
    private lastObservationTime: number = 0;
    private currentSnapshot: BallSnapshot | null = null;
    private predictedImpactZ: number = 0;
    private isMoving: boolean = false;
    private targetDirection: 'up' | 'down' | 'stay' = 'stay';
    private shouldMissThisShot: boolean = false;
    
    // Game constants (must match Pong3Dscene)
    private readonly FIELD_WIDTH = 60;
    private readonly FIELD_LENGTH = 50;
    private readonly GROUND_HEIGHT = 45;
    private readonly PADDLE_X_POSITION = this.FIELD_WIDTH / 2 - 5;
    private readonly GRAVITY = -0.02;
    
    // Keyboard simulation
    public currentKey: string | null = null;
    
    score: number = 0;
    
    constructor(paddle: BABYLON.Mesh, ball: BABYLON.Mesh, difficulty: AiDifficulty3D = "easy")
    {
        this.paddle = paddle;
        this.ball = ball;
        this.difficulty = difficulty;
        this.settings = this.getSettings(difficulty);
        
        console.log(`AI initialized - Difficulty: ${difficulty}`);
        console.log(`Observation rate: ${this.settings.reactionTime}ms`);
    }
    
    private getSettings(difficulty: AiDifficulty3D): DifficultySettings
    {
        switch(difficulty)
        {
            case "hard":
                return {
                    reactionTime: 1000,          // Can only observe once per second
                    predictionAccuracy: 0.90,    // 90% accurate predictions
                    errorMargin: 0.5,            // Small positioning error
                    missChance: 0.05,            // 5% chance to miss
                    responseDelay: 100           // Quick response
                };
            default: // easy
                return {
                    reactionTime: 1000,          // Can only observe once per second
                    predictionAccuracy: 0.70,    // 70% accurate predictions
                    errorMargin: 2.0,            // Larger positioning error
                    missChance: 0.20,            // 20% chance to miss
                    responseDelay: 300           // Slower response
                };
        }
    }
    
     * Main update function - called every frame
     * Simulates limited vision: AI can only "see" once per reactionTime
    
    public update(currentTime: number, ballVelocity: BABYLON.Vector3): void
    {
        // Check if it's time for a new observation
        if (currentTime - this.lastObservationTime >= this.settings.reactionTime)
        {
            this.observeGame(currentTime, ballVelocity);
            this.lastObservationTime = currentTime;
        }
        
        // Execute the current decision (simulate keyboard input)
        this.executeMovement();
    }
    
    /**
     * AI "observes" the game state and makes a decision
     * This only happens once per second (or per reactionTime)
     
    private observeGame(currentTime: number, ballVelocity: BABYLON.Vector3): void
    {
        // Take a snapshot of the current game state
        this.currentSnapshot = {
            position: this.ball.position.clone(),
            velocity: ballVelocity.clone(),
            timestamp: currentTime
        };
        
        // Only make decisions if ball is heading towards AI
        if (ballVelocity.x > 0)
        {
            // Decide if AI should miss this shot
            this.shouldMissThisShot = Math.random() < this.settings.missChance;
            
            if (this.shouldMissThisShot)
            {
                console.log("AI: Intentionally missing this shot");
                this.targetDirection = 'stay';
                this.currentKey = null;
                return;
            }
            
            // Predict where the ball will be when it reaches the paddle
            this.predictedImpactZ = this.predictBallImpact(
                this.currentSnapshot.position,
                this.currentSnapshot.velocity
            );
            
            // Add error based on difficulty
            const error = (Math.random() - 0.5) * this.settings.errorMargin;
            this.predictedImpactZ += error;
            
            // Decide which direction to move
            this.makeDecision();
            
            console.log(`AI Decision: Ball at Z=${this.ball.position.z.toFixed(1)}, ` +
                       `Predicted impact: ${this.predictedImpactZ.toFixed(1)}, ` +
                       `Action: ${this.targetDirection}`);
        }
        else
        {
            // Ball moving away - return to center
            this.returnToCenter();
        }
    }
    
    /**
     * Physics-based prediction of where ball will intersect paddle's X position
     * Accounts for: velocity, gravity, wall bounces
     
    private predictBallImpact(pos: BABYLON.Vector3, vel: BABYLON.Vector3): number
    {
        // Apply prediction accuracy - less accurate AI makes more mistakes
        const accuracyFactor = this.settings.predictionAccuracy;
        
        // Clone to avoid modifying originals
        let currentPos = pos.clone();
        let currentVel = vel.clone();
        
        // Simulate forward in time until ball reaches paddle
        let maxIterations = 1000; // Prevent infinite loops
        let iterations = 0;
        
        while (iterations < maxIterations)
        {
            iterations++;
            
            // Apply gravity
            currentVel.y += this.GRAVITY;
            
            // Move ball forward
            currentPos.addInPlace(currentVel);
            
            // Check if ball reached paddle's X position
            if (currentPos.x >= this.PADDLE_X_POSITION)
            {
                // Apply accuracy factor - less accurate AI has more error
                const predictedZ = currentPos.z;
                const inaccuracy = (1 - accuracyFactor) * (Math.random() - 0.5) * 10;
                return predictedZ + inaccuracy;
            }
            
            // Simulate wall bounces (Z-axis)
            const wallBoundary = this.FIELD_LENGTH / 2 - 1;
            if (currentPos.z > wallBoundary || currentPos.z < -wallBoundary)
            {
                currentVel.z *= -1;
                currentPos.z = Math.max(-wallBoundary, Math.min(wallBoundary, currentPos.z));
            }
            
            // Simulate ground bounce (Y-axis)
            if (currentPos.y <= this.GROUND_HEIGHT + 1)
            {
                currentPos.y = this.GROUND_HEIGHT + 1;
                currentVel.y *= -0.8;
            }
            
            // Ball went past paddle without hitting - shouldn't happen but safety check
            if (currentPos.x > this.PADDLE_X_POSITION + 5)
            {
                return currentPos.z;
            }
        }
        
        // Fallback: return current position if prediction fails
        return this.ball.position.z;
    }
    
    /**
     * Decide which key to "press" based on predicted impact point
     
    private makeDecision(): void
    {
        const paddleZ = this.paddle.position.z;
        const targetZ = this.predictedImpactZ;
        const threshold = 1.0; // Dead zone - don't move if close enough
        
        if (Math.abs(targetZ - paddleZ) < threshold)
        {
            this.targetDirection = 'stay';
            this.currentKey = null;
        }
        else if (targetZ > paddleZ)
        {
            // Need to move up (positive Z)
            this.targetDirection = 'up';
            this.currentKey = '4'; // Simulates pressing '4' key
        }
        else
        {
            // Need to move down (negative Z)
            this.targetDirection = 'down';
            this.currentKey = '6'; // Simulates pressing '6' key
        }
    }
    
    /**
     * When ball is moving away, return paddle to center position
     
    private returnToCenter(): void
    {
        const paddleZ = this.paddle.position.z;
        const centerZ = 0;
        const threshold = 1.0;
        
        if (Math.abs(centerZ - paddleZ) < threshold)
        {
            this.targetDirection = 'stay';
            this.currentKey = null;
        }
        else if (centerZ > paddleZ)
        {
            this.targetDirection = 'up';
            this.currentKey = '4';
        }
        else
        {
            this.targetDirection = 'down';
            this.currentKey = '6';
        }
    }
    
    /**
     * Execute the movement - this simulates holding down a key
     * Called every frame, but decision is only made once per second
     
    private executeMovement(): void
    {
        // The actual movement will be handled by the main game loop
        // which checks this.currentKey
        // This simulates the AI "holding down" a key between observations
    }
    
    /**
     * Get the current keyboard input the AI is simulating
     
    public getSimulatedInput(): string | null
    {
        return this.currentKey;
    }
    
    /**
     * Get AI's target position for debugging
     
    public getTargetPosition(): number
    {
        return this.predictedImpactZ;
    }
    
    /**
     * Check if AI is currently trying to miss
     
    public isMissing(): boolean
    {
        return this.shouldMissThisShot;
    }
}
*/