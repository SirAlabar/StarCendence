import * as BABYLON from "@babylonjs/core";
import { Skybox } from "./Skybox";

export class Pong3Dscene 
{
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera!: BABYLON.FreeCamera;
    private topCamera!: BABYLON.FreeCamera;
    private light!: BABYLON.HemisphericLight;
    private ball!: BABYLON.Mesh;
    private paddle_left!: BABYLON.Mesh;
    private paddle_right!: BABYLON.Mesh;
    private ballVelocity = new BABYLON.Vector3(0.2, 0, 0.1); 
    private maxSpeed: number = 0.6; 
    private gravity = -0.02; 
    private canChangeCamera: boolean = true;
    
    private readonly FIELD_WIDTH = 60;          // X-axis (paddle to paddle distance)
    private readonly FIELD_LENGTH = 40;         // Z-axis (wall to wall distance)
    private readonly GROUND_HEIGHT = 0;         // Ground level
    
    private keys: Record<string, boolean> = {};
    
    constructor(private canvas: HTMLCanvasElement) 
    {
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        this.setupInput();
        this.createCamera();
        this.createLight();
        this.createEnvironment();
        this.createGameObjects();
        this.enableCollisions();
        this.setupGameLoop();
        window.addEventListener("resize", () => this.engine.resize());
        console.log(this.canvas);
    }
    
    private setupInput() 
    {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            this.keys[key] = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
        });
    }
    
    private createCamera() 
    {

        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), this.scene);
        this.camera.position = new BABYLON.Vector3(-100, 20, 0);
        this.camera.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        

        this.topCamera = new BABYLON.FreeCamera("topCamera", new BABYLON.Vector3(0, 80, 0), this.scene);
        this.topCamera.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        this.scene.activeCamera = this.camera;
    }
    
    private createLight() 
    {
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.2; 
    }
    
    private createEnvironment() 
    {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: this.FIELD_WIDTH,height: this.FIELD_LENGTH}, this.scene);
        ground.position.y = this.GROUND_HEIGHT;
        ground.visibility = 0;
        ground.checkCollisions = true;
        // Load skybox
        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");
    }
    
    private createGameObjects() 
    {
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 2 }, this.scene);
        const ballMat = new BABYLON.StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        ballMat.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);          // glow
        this.ball.material = ballMat;
        this.ball.position = new BABYLON.Vector3(0, this.GROUND_HEIGHT + 1, 0);
        

        const paddleMat = new BABYLON.StandardMaterial("paddleMat", this.scene);
        paddleMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
        paddleMat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05); // Slight glow
        
        this.paddle_left = BABYLON.MeshBuilder.CreateBox("left_paddle", {width: 1.5, height: 4, depth: 10}, this.scene);
        this.paddle_left.position = new BABYLON.Vector3(-this.FIELD_WIDTH / 2 + 5, this.GROUND_HEIGHT + 2, 0);
        this.paddle_left.material = paddleMat;
        
        const paddleMat2 = paddleMat.clone("paddleMat2");
        paddleMat2.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.9);
        paddleMat2.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.3);
        
        this.paddle_right = BABYLON.MeshBuilder.CreateBox("right_paddle", {width: 1.5, height: 4, depth: 10}, this.scene);
        this.paddle_right.position = new BABYLON.Vector3(this.FIELD_WIDTH / 2 - 5, this.GROUND_HEIGHT + 2, 0);
        this.paddle_right.material = paddleMat2;
    }
    
    private enableCollisions() 
    {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;
    
        this.paddle_left.ellipsoid = new BABYLON.Vector3(0.75, 2, 5);
        this.paddle_right.ellipsoid = new BABYLON.Vector3(0.75, 2, 5);
    }
    
    private setupGameLoop() 
    {
        this.scene.onBeforeRenderObservable.add(() => {
          
            this.ballVelocity.y += this.gravity;
            this.ball.position.addInPlace(this.ballVelocity);
            
            // Ground collision
            const ballRadius = 1;
            if (this.ball.position.y <= this.GROUND_HEIGHT + ballRadius) 
            {
                this.ball.position.y = this.GROUND_HEIGHT + ballRadius;
                this.ballVelocity.y *= -0.8; 
            }
            
            // Wall collisions (Z-axis)
            const wallBoundary = this.FIELD_LENGTH / 2 - 1;
            if (Math.abs(this.ball.position.z) >= wallBoundary) 
                this.ballWallCollision();
            
            
            this.checkPaddleCollision();
            this.limitBallSpeed();
            
            // Goal detection (X-axis)
            const goalBoundary = this.FIELD_WIDTH / 2;
            if (this.ball.position.x > goalBoundary || this.ball.position.x < -goalBoundary)
                this.resetBall();
            
            
            this.handleKeys();
        });
        
        this.engine.runRenderLoop(() => this.scene.render());
    }
    
    private limitBallSpeed(): void
    {
        const speed = this.ballVelocity.length();
        if (speed > this.maxSpeed)
            this.ballVelocity.normalize().scaleInPlace(this.maxSpeed);
    }
    
    private ballWallCollision(): void
    {
        this.ballVelocity.z *= -1;
        
        // Clamp ball position to prevent getting stuck
        const wallBoundary = this.FIELD_LENGTH / 2 - 1;
        if (this.ball.position.z > wallBoundary) this.ball.position.z = wallBoundary;
        if (this.ball.position.z < -wallBoundary) this.ball.position.z = -wallBoundary;
        
        const minSpeedx = 0.2;
        if (Math.abs(this.ballVelocity.x) < minSpeedx) 
        {
            const direction = this.ballVelocity.x >= 0 ? 1 : -1;
            this.ballVelocity.x = direction * minSpeedx;
        }
    }
    
    private async resetBall(): Promise<void>
    {
        this.ball.isVisible = false;
        await this.delay(2000);
        this.ballVelocity.set(0, 0, 0);
        this.ball.position.set(0, this.GROUND_HEIGHT + 1, 0);
        this.ball.isVisible = true;
        
        const direction = Math.random() < 0.5 ? 1 : -1;
        this.ballVelocity = new BABYLON.Vector3(0.2 * direction, 0, 0.1);
    }
    
    private delay(ms: number): Promise<void>
    {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
    private checkPaddleCollision() 
    {
        // Left paddle collision
        if (this.ball.intersectsMesh(this.paddle_left, false)) 
        {
            this.repositionPaddle();
            this.ballVelocity.x = Math.abs(this.ballVelocity.x) * 1.05; // Slight speed boost
            const hitOffset = this.ball.position.z - this.paddle_left.position.z;
            this.ballVelocity.z += hitOffset * 0.02;
        }
        
        // Right paddle collision
        if (this.ball.intersectsMesh(this.paddle_right, false)) 
        {
            this.repositionPaddle();
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x) * 1.05; // Slight speed boost
            const hitOffset = this.ball.position.z - this.paddle_right.position.z;
            this.ballVelocity.z += hitOffset * 0.02;
        }
    }
    
    private repositionPaddle(): void
    {
        this.paddle_left.position.y = this.GROUND_HEIGHT + 2;
        this.paddle_right.position.y = this.GROUND_HEIGHT + 2;
        this.paddle_left.position.x = -this.FIELD_WIDTH / 2 + 5;
        this.paddle_right.position.x = this.FIELD_WIDTH / 2 - 5;
    }
    
    private changeCamera(): void 
    {
        if (this.scene.activeCamera === this.camera) 
            this.scene.activeCamera = this.topCamera;
        else 
            this.scene.activeCamera = this.camera;
    }
    
    private handleKeys(): void
    {
        const paddleSpeed = 0.5;                        
        const moveBoundary = this.FIELD_LENGTH / 2 - 6; 
        
        // Player 1
        const moveVector = new BABYLON.Vector3(0, 0, 0);
        if (this.keys["a"] && this.paddle_left.position.z < moveBoundary) 
            moveVector.z += paddleSpeed;
        if (this.keys["d"] && this.paddle_left.position.z > -moveBoundary) 
            moveVector.z -= paddleSpeed;
        
        // Player 2
        const moveVector2 = new BABYLON.Vector3(0, 0, 0);
        if (this.keys["4"] && this.paddle_right.position.z < moveBoundary) 
            moveVector2.z += paddleSpeed;
        if (this.keys["6"] && this.paddle_right.position.z > -moveBoundary) 
            moveVector2.z -= paddleSpeed;
        
        // Camera switch
        if (this.keys["c"] && this.canChangeCamera)
        {
            this.changeCamera();
            this.canChangeCamera = false;
            setTimeout(() => this.canChangeCamera = true, 500);
        }
        
        this.paddle_left.moveWithCollisions(moveVector);
        this.paddle_right.moveWithCollisions(moveVector2);
    }
    
    dispose() 
    {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}