import * as BABYLON from "@babylonjs/core";
import { Skybox } from "./Skybox";
import { bayerDitherFunctions } from "@babylonjs/core/Shaders/ShadersInclude/bayerDitherFunctions";

export class Pong3Dscene 
{
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera!: BABYLON.FreeCamera;
    private light!: BABYLON.HemisphericLight;
    private ball!: BABYLON.Mesh;
    private paddle_left!: BABYLON.Mesh;
    private paddle_right!: BABYLON.Mesh;
    private ballVelocity = new BABYLON.Vector3(0.1, 0, 0.05); // x, y, z speed
    private gravity = -0.01; // gravity strength
    private leftWall!: BABYLON.Mesh;
    private rightWall!: BABYLON.Mesh;
    //private backWall!: BABYLON.Mesh;

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
        console.log(this.canvas);

        window.addEventListener("resize", () => this.engine.resize());
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
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(-10, 2, 0), this.scene);
    }

    private createLight() 
    {
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.8;
    }

    private createEnvironment() 
    {
        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.scene);
        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.26, 0.89, 0.07);
        ground.material = groundMat;

        // Walls
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0, 0.5, 0.5);

        this.leftWall = BABYLON.MeshBuilder.CreateBox("left_wall", { width: 0.5, height: 3, depth: 20 }, this.scene);
        this.leftWall.position = new BABYLON.Vector3(0, 1.5, 10);
        this.leftWall.rotation.y = Math.PI / 2;
        this.leftWall.material = wallMat;

        this.rightWall = this.leftWall.clone("right_wall");
        this.rightWall.position = new BABYLON.Vector3(0, 1.5, -10);
        this.rightWall.material = wallMat;

        //this.backWall = BABYLON.MeshBuilder.CreateBox("backWall", { width: 0.5, height: 3, depth: 20 }, this.scene);
        //this.backWall.position = new BABYLON.Vector3(10,1.5,0);

        // Goal
        const goalPlane = BABYLON.MeshBuilder.CreatePlane("goalPlane", { width: 20, height: 3 }, this.scene);
        goalPlane.position = new BABYLON.Vector3(10, 1.5, 0);
        goalPlane.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

        const goalMat = new BABYLON.StandardMaterial("goalMat", this.scene);
        goalMat.diffuseTexture = new BABYLON.Texture("assets/images/goaltest.png", this.scene);
        goalMat.diffuseTexture.hasAlpha = true;
        goalMat.backFaceCulling = false;
        goalPlane.material = goalMat;

        Skybox.create(this.scene, "assets/images/skyboxpong.hdr");
    }

    private createGameObjects() 
    {
        // Ball
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, this.scene);
        const ballMat = new BABYLON.StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.ball.material = ballMat;
        this.ball.position = new BABYLON.Vector3(0, 0.5, 0);

        // Paddles
        const paddleMat = new BABYLON.StandardMaterial("paddleMat", this.scene);
        paddleMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);

        this.paddle_left = BABYLON.MeshBuilder.CreateBox("left_paddle", { width: 0.4, height: 1, depth: 2 }, this.scene);
        this.paddle_left.position = new BABYLON.Vector3(-8, 0.5, 0);
        this.paddle_left.material = paddleMat;

        this.paddle_right = BABYLON.MeshBuilder.CreateBox("right_paddle", { width: 0.4, height: 1, depth: 2 }, this.scene);
        this.paddle_right.position = new BABYLON.Vector3(8, 0.5, 0);
        this.paddle_right.material = paddleMat;

        this.camera.parent = this.paddle_left;
        this.camera.position = new BABYLON.Vector3(-12, 2, 0);
        this.camera.setTarget(this.paddle_left.position.add(new BABYLON.Vector3(10, 0, 0)));
    }

    private enableCollisions() 
    {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;
        
    
    }

    private setupGameLoop() 
    {
        this.scene.onBeforeRenderObservable.add(() => {
            this.ballVelocity.y += this.gravity;
            this.ball.position.addInPlace(this.ballVelocity);
            if (this.ball.position.y <= 0.25) 
            {
                this.ball.position.y = 0.25;
                this.ballVelocity.y *= -0.8; 
            }     
            if (Math.abs(this.ball.position.z) >= 9.75) 
            {
                this.ballVelocity.z *= -1;
            }
            this.checkPaddleCollision();
            if(this.ball.position.x > 10 && this.ball.position.x < -10)
            {
                this.resetBall();
                console.log("goal");
            }
            const moveVector = new BABYLON.Vector3(0, 0, 0);
            if (this.keys["a"]) moveVector.z += 0.1;
            if (this.keys["d"]) moveVector.z -= 0.1;
            const moveVector2 = new BABYLON.Vector3(0, 0, 0);
            if (this.keys["4"]) moveVector2.z += 0.1;
            if (this.keys["6"]) moveVector2.z -= 0.1;
            this.paddle_left.moveWithCollisions(moveVector);
            this.paddle_right.moveWithCollisions(moveVector2);
        });

        this.engine.runRenderLoop(() => this.scene.render());
    }

    private resetBall(): void
    {
        this.ball.dispose();
    }

    private checkPaddleCollision() 
    {
        // Left paddle collision
        if (this.ball.intersectsMesh(this.paddle_left, false)) 
        {
            this.ballVelocity.x = Math.abs(this.ballVelocity.x); // Bounce right
                // Add spin based on where it hits the paddle
            const hitOffset = this.ball.position.z - this.paddle_left.position.z;
            this.ballVelocity.z += hitOffset * 0.1;
        }
        
        // Right paddle collision
        if (this.ball.intersectsMesh(this.paddle_right, false)) 
        {
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x); // Bounce left
            const hitOffset = this.ball.position.z - this.paddle_right.position.z;
            this.ballVelocity.z += hitOffset * 0.1;
        }
    }

    dispose() 
    {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}
