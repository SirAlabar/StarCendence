import * as BABYLON from "@babylonjs/core";

export type AiDifficulty3D = 'easy' | 'hard';

export class Enemy3D
{
    private difficulty: AiDifficulty3D;
    private targetZ: number = 0;
    private shouldMiss: boolean = false;
    private paddle: BABYLON.Mesh;
    private ball: BABYLON.Mesh;
    private ballVelocity: BABYLON.Vector3;
    private missChance = 0;
    private readonly FIELD_LENGTH = 50;
    private decisionTimer: number = 0;
    private readonly DECISION_INTERVAL = 0.15; // React faster
    
    speed: number = 5;
    score: number = 0;

    constructor(paddle: BABYLON.Mesh, ball: BABYLON.Mesh,ballVelocity: BABYLON.Vector3,difficulty: AiDifficulty3D,)
    {
        this.paddle = paddle;
        this.ball = ball;
        this.ballVelocity = ballVelocity;
        this.difficulty = difficulty;
        
        if(this.difficulty == "hard")
            this.missChance = 0.10; // Almost never miss
        else
            this.missChance = 0.25; // Miss occasionally
            
        this.targetZ = this.ball.position.z;
    }

    private getRandomMissPosition(): number 
    {
        const edgeZone = 8;
        const moveBoundary = this.FIELD_LENGTH / 2 - 6;
        
        if (Math.random() < 0.5) 
            return -moveBoundary + Math.random() * edgeZone;
        else 
            return moveBoundary - Math.random() * edgeZone;
    }

    
    private predictBallPosition(): number 
    {
        
        if (this.ballVelocity.x <= 0) 
            return 0;

        const distanceToTravel = this.paddle.position.x - this.ball.position.x;
        if (distanceToTravel <= 0) 
            return this.ball.position.z;
        const timeToReach = distanceToTravel / Math.abs(this.ballVelocity.x);
        let predictedZ = this.ball.position.z + (this.ballVelocity.z * timeToReach);
        const wallBoundary = this.FIELD_LENGTH / 2 - 1;
        let bounceCount = 0;
        while (Math.abs(predictedZ) > wallBoundary && bounceCount < 5) 
        {
            if (predictedZ > wallBoundary) 
            {
                const excess = predictedZ - wallBoundary;
                predictedZ = wallBoundary - excess;
            } 
            else if (predictedZ < -wallBoundary) 
            {
                const excess = -wallBoundary - predictedZ;
                predictedZ = -wallBoundary + excess;
            }
            bounceCount++;
        }
        
        // Clamp to safe zone
        const moveBoundary = this.FIELD_LENGTH / 2 - 6;
        predictedZ = Math.max(-moveBoundary, Math.min(moveBoundary, predictedZ));
        
        return predictedZ;
    }

    public update(deltaTime: number): void
    {
        const moveBoundary = this.FIELD_LENGTH / 2 - 6;
  
        this.decisionTimer += deltaTime;
        
        if (this.decisionTimer >= this.DECISION_INTERVAL) 
        {
         
            if (this.ballVelocity.x > 0 && Math.random() < this.missChance) 
            {
                this.shouldMiss = true;
                this.targetZ = this.getRandomMissPosition();
            }
            else 
            {
                this.shouldMiss = false;
                if (this.ballVelocity.x > 0) 
                {
                    this.targetZ = this.predictBallPosition();
                }
                else 
                {
                    this.targetZ = 0;
                }
            }
            
            this.decisionTimer = 0;
        }

        const distance = this.targetZ - this.paddle.position.z;        
        let baseSpeed = this.difficulty == "hard" ? 60 : 40;
        const ballDistance = Math.abs(this.paddle.position.x - this.ball.position.x);
        if (ballDistance < 20 && this.ballVelocity.x > 0) 
        {
            baseSpeed *= 1.5; // Move faster when ball is close
        }
        
        const speed = baseSpeed * deltaTime;
        
        // Move towards target
        if (Math.abs(distance) > 0.2) 
        {
            const movement = Math.sign(distance) * Math.min(Math.abs(distance), speed);
            this.paddle.position.z += movement;
        }
        
        // Clamp paddle to boundaries
        this.paddle.position.z = Math.max(-moveBoundary, Math.min(moveBoundary, this.paddle.position.z));
    }

    public updateBallVelocity(newVelocity: BABYLON.Vector3): void
    {
        this.ballVelocity = newVelocity;
    }

    public getDifficulty(): AiDifficulty3D
    {
        return this.difficulty;
    }

    public getShouldMiss(): boolean
    {
        return this.shouldMiss;
    }
}