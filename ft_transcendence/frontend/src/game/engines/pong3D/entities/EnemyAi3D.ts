import * as BABYLON from "@babylonjs/core";

export type AiDifficulty3D = 'easy' | 'hard';

interface DifficultySettings 
{
    errorMargin: number;                        // How far off from perfect positioning
    missChance: number;                         // Probability of intentional miss (0-1)
    predictionAccuracy: number;                 // How accurate ball prediction is (0-1)
}

export class Enemy3D
{
    private difficulty: AiDifficulty3D;
    private setting: DifficultySettings;
    private targetZ: number = 0;
    private shouldMiss: boolean = false;
    private paddle: BABYLON.Mesh;
    private ball: BABYLON.Mesh;
    speed: number = 5;
    score: number = 0;

    constructor(paddle: BABYLON.Mesh, ball: BABYLON.Mesh, difficulty: AiDifficulty3D = "easy")
    {
        this.paddle = paddle;
        this.ball = ball;
        this.difficulty = difficulty;
        this.setting = this.getSetting(difficulty);
    }

    private getSetting(difficulty: AiDifficulty3D): DifficultySettings
    {
        switch(difficulty)
        {
            case "hard":
                return {errorMargin:0.3 , missChance: 0.05, predictionAccuracy: 0.9};
            default:
                return {errorMargin:1.2, missChance: 0.2, predictionAccuracy: 0.6};
        }
    }

    public update(deltaTime: number)
    {
        const prediction = this.ball.position.z;
        this.targetZ = prediction;

        const speed = 15 * deltaTime;
        this.paddle.position.z += Math.sign(this.targetZ - this.paddle.position.z) * speed;
        
    }


}