import {Engine, Scene, FreeCamera, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Vector3, Color3, Color4, KeyboardEventTypes, AbstractMesh} from "@babylonjs/core";
import { Skybox } from "./entities/Skybox";
import { loadModel } from "./entities/ModelLoader";

export class Pong3Dscene 
{
    private engine: Engine;
    private scene: Scene;
    private camera!: FreeCamera;
    private topCamera!: FreeCamera;
    private light!: HemisphericLight;
    private ball!: Mesh;
    private paddle_left!: Mesh;
    private paddle_right!: Mesh;
    private ballVelocity = new Vector3(0.2, 0, 0.1); 
    private maxSpeed: number = 0.6; 
    private gravity = -0.02; 
    private canChangeCamera: boolean = true;
    private platform: AbstractMesh[] = [];
    
    private readonly FIELD_WIDTH = 60;          // X-axis (paddle to paddle distance)
    private readonly FIELD_LENGTH = 50;         // Z-axis (wall to wall distance)
    private readonly GROUND_HEIGHT = 45;         // Ground level
    
    private keys: Record<string, boolean> = {};
    
    constructor(private canvas: HTMLCanvasElement) 
    {
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
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
            this.keys[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
        });
    }
    
    private createCamera() 
    {

        this.camera = new FreeCamera("camera", new Vector3(0, 0, 0), this.scene);
        this.camera.position = new Vector3(-100, 70, 0);
        this.camera.rotation = new Vector3(Math.PI / 11, Math.PI / 2, 0);
        

        this.topCamera = new FreeCamera("topCamera", new Vector3(0, 102.50, 0), this.scene);
        this.topCamera.rotation = new Vector3(Math.PI / 2, 0, 0);
        this.scene.activeCamera = this.camera;
    }
    
    private createLight() 
    {
        this.light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.2; 
    }
    
    private async createEnvironment() 
    {
        const ground = MeshBuilder.CreateGround("ground", {width: this.FIELD_WIDTH,height: this.FIELD_LENGTH}, this.scene);
        ground.position.y = this.GROUND_HEIGHT;
        ground.visibility = 0;
        ground.checkCollisions = true;
        // Load skybox
        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");
        this.platform = await loadModel(this.scene,"assets/models/pong/", "sci-fi_platform.glb", new Vector3(0, 0, 0));
        this.platform[0].scaling = new Vector3(6.5,6.5,6.5);
        this.platform[0].position = new Vector3(0, -70, 0);
    }
    
    private createGameObjects() 
    {
        this.ball = MeshBuilder.CreateSphere("ball", { diameter: 2 }, this.scene);
        const ballMat = new StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new Color3(1, 1, 0);
        ballMat.emissiveColor = new Color3(0.2, 0.2, 0);          // glow
        this.ball.material = ballMat;
        this.ball.position = new Vector3(0, this.GROUND_HEIGHT + 1, 0);
        

        const paddleMat = new StandardMaterial("paddleMat", this.scene);
        paddleMat.diffuseColor = new Color3(0.9, 0.1, 0.1);
        paddleMat.emissiveColor = new Color3(0.3, 0.05, 0.05); // Slight glow
        
        this.paddle_left = MeshBuilder.CreateBox("left_paddle", {width: 1.5, height: 2, depth: 10}, this.scene);
        this.paddle_left.position = new Vector3(-this.FIELD_WIDTH / 2 + 5, this.GROUND_HEIGHT + 1, 0);
        this.paddle_left.material = paddleMat;
        
        const paddleMat2 = paddleMat.clone("paddleMat2");
        paddleMat2.diffuseColor = new Color3(0.1, 0.1, 0.9);
        paddleMat2.emissiveColor = new Color3(0.05, 0.05, 0.3);
        
        this.paddle_right = MeshBuilder.CreateBox("right_paddle", {width: 1.5, height: 2, depth: 10}, this.scene);
        this.paddle_right.position = new Vector3(this.FIELD_WIDTH / 2 - 5, this.GROUND_HEIGHT + 1, 0);
        this.paddle_right.material = paddleMat2;

        

    }
    
    private enableCollisions() 
    {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;
    
        this.paddle_left.ellipsoid = new Vector3(0.75, 1, 5);
        this.paddle_right.ellipsoid = new Vector3(0.75, 1, 5);
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
        if (this.ball.position.z > wallBoundary) 
        {
            this.ball.position.z = wallBoundary;
            this.flashWallHit(new Vector3(this.ball.position.x, this.ball.position.y, wallBoundary));
        }
        if (this.ball.position.z < -wallBoundary) 
        {
            this.flashWallHit(new Vector3(this.ball.position.x, this.ball.position.y, -wallBoundary));
            this.ball.position.z = -wallBoundary;
        }
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
        this.ballVelocity = new Vector3(0.2 * direction, 0, 0.1);
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
        this.paddle_left.position.y = this.GROUND_HEIGHT + 1;
        this.paddle_right.position.y = this.GROUND_HEIGHT + 1;
        this.paddle_left.position.x = -this.FIELD_WIDTH / 2 + 5;
        this.paddle_right.position.x = this.FIELD_WIDTH / 2 - 5;
    }
    
    private changeCamera(): void 
    {
        if (this.scene.activeCamera === this.camera)
        {
            this.scene.activeCamera = this.topCamera;
            this.topCamera.attachControl(this.canvas, true);
        }
        else 
            this.scene.activeCamera = this.camera;
    }
    
    private handleKeys(): void
    {
        const paddleSpeed = 0.5;                        
        const moveBoundary = this.FIELD_LENGTH / 2 - 6; 
        
        // Player 1
        const moveVector = new Vector3(0, 0, 0);
        if (this.keys["a"] && this.paddle_left.position.z < moveBoundary) 
            moveVector.z += paddleSpeed;
        if (this.keys["d"] && this.paddle_left.position.z > -moveBoundary) 
            moveVector.z -= paddleSpeed;
        
        // Player 2
        const moveVector2 = new Vector3(0, 0, 0);
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
    
    private flashWallHit(position: Vector3): void 
    {
        const goalBoundary = this.FIELD_WIDTH / 2;
        if (this.ball.position.x > goalBoundary || this.ball.position.x < -goalBoundary)
            return;
        
        const size = 4; 
        const flash = MeshBuilder.CreatePlane("flash", { size }, this.scene);
        
        const mat = new StandardMaterial("flashMat", this.scene);
        mat.diffuseColor = new Color3(1, 0, 0);
        mat.emissiveColor = new Color3(1, 0, 0);
        mat.alpha = 0.8; 
        mat.backFaceCulling = false; // Make it visible from both sides
        flash.material = mat;
        
        flash.position.copyFrom(position);
        
        // Rotate plane to be perpendicular to Z-axis (facing along X-axis)
        //flash.rotation.y = Math.PI / 2;
               
        // Fade out animation
        let alpha = 0.8;
        const interval = setInterval(() => {
            alpha -= 0.05;
            mat.alpha = alpha;
            if (alpha <= 0) {
                flash.dispose();
                clearInterval(interval);
            }
        }, 30);
    }




    dispose() 
    {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}