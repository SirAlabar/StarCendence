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
    private ballVelocity = new BABYLON.Vector3(0.1, 0, 0.05); // x, y, z speed
    private maxSpeed: number = 0.3;
    private gravity = -0.01; // gravity strength
    private leftWall!: BABYLON.Mesh;
    private rightWall!: BABYLON.Mesh;
    private canChangeCamera: boolean = true;
    
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
        this.camera.position = new BABYLON.Vector3(-25, 11.25, 0);
        this.camera.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        
        //top camera
        this.topCamera = new BABYLON.FreeCamera("topCamera", new BABYLON.Vector3(0,25,0));
        this.topCamera.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        this.scene.activeCamera = this.camera;
        //this.scene.activeCamera.attachControl(this.canvas, true);

    }

    private createLight() 
    {
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.8;
    }

    private createEnvironment() 
    {
        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 15 }, this.scene);
        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.26, 0.89, 0.07);
        ground.position.y = 5;
        ground.checkCollisions = true;

        // Walls
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0, 0.5, 0.5);
        const wallColor = new BABYLON.StandardMaterial("wallColor", this.scene);
        wallColor.diffuseColor = new BABYLON.Color3(0.823, 0.411, 0.117);


        this.leftWall = BABYLON.MeshBuilder.CreateBox("left_wall", { width: 0.5, height: 3, depth: 20 }, this.scene);
        this.leftWall.position = new BABYLON.Vector3(0, 6, 7.5);
        this.leftWall.rotation.y = Math.PI / 2;
        this.leftWall.visibility = 0;
        //this.leftWall.material = wallColor;

        this.rightWall = this.leftWall.clone("right_wall");
        this.rightWall.position = new BABYLON.Vector3(0, 6, -7.5);
        this.rightWall.visibility = 0;
        //this.rightWall.material = wallColor;

        //this.backWall = BABYLON.MeshBuilder.CreateBox("backWall", { width: 0.5, height: 3, depth: 20 }, this.scene);
        //this.backWall.position = new BABYLON.Vector3(10,1.5,0);

        // Goal
        //const goalPlane = BABYLON.MeshBuilder.CreatePlane("goalPlane", { width: 15, height: 3 }, this.scene);
        //goalPlane.position = new BABYLON.Vector3(10, 6, 0);
        //goalPlane.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

        //const goalPlane2 = BABYLON.MeshBuilder.CreatePlane("goalPlane2", { width: 20, height: 3 }, this.scene);
        //goalPlane2.position = new BABYLON.Vector3(-10, 1, 0);
        //goalPlane2.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

        //const goalMat = new BABYLON.StandardMaterial("goalMat", this.scene);
        //goalMat.diffuseTexture = new BABYLON.Texture("assets/images/goaltest.png", this.scene);
        //goalMat.diffuseTexture.hasAlpha = true;
        //goalMat.backFaceCulling = false;
        //goalPlane.material = goalMat;
        //goalPlane2.material = goalMat;

        const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
        floorMat.diffuseTexture = new BABYLON.Texture("assets/images/floor2.jpg", this.scene);
        floorMat.diffuseTexture.hasAlpha = true;
        floorMat.backFaceCulling = false;
        ground.material = floorMat;
        ground.visibility = 1;
        Skybox.createFromGLB(this.scene, "assets/images/skybox2.glb");
    }

    private createGameObjects() 
    {
        // Ball
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, this.scene);
        const ballMat = new BABYLON.StandardMaterial("ballMat", this.scene);
        ballMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.ball.material = ballMat;
        this.ball.position = new BABYLON.Vector3(0, 5.5, 0);

        // Paddles
        const paddleMat = new BABYLON.StandardMaterial("paddleMat", this.scene);
        paddleMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);

        this.paddle_left = BABYLON.MeshBuilder.CreateBox("left_paddle", { width: 0.4, height: 1, depth: 3 }, this.scene);
        this.paddle_left.position = new BABYLON.Vector3(-8, 5.5, 0);
        this.paddle_left.material = paddleMat;

        this.paddle_right = BABYLON.MeshBuilder.CreateBox("right_paddle", { width: 0.4, height: 1, depth: 3 }, this.scene);
        this.paddle_right.position = new BABYLON.Vector3(8, 5.5, 0);
        this.paddle_right.material = paddleMat;

    }

    private enableCollisions() 
    {
        this.scene.collisionsEnabled = true;
        this.ball.checkCollisions = true;
        
        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;
        this.leftWall.checkCollisions = true;
        this.rightWall.checkCollisions =  true;
        this.paddle_left.ellipsoid = new BABYLON.Vector3(0.2, 0.5, 1.5);
        this.paddle_right.ellipsoid = new BABYLON.Vector3(0.2, 0.5, 1.5);
    }

    private setupGameLoop() 
    {
        this.scene.onBeforeRenderObservable.add(() => {
            this.ballVelocity.y += this.gravity;
            this.ball.position.addInPlace(this.ballVelocity);
            if (this.ball.position.y <= 5.25) 
            {
                this.ball.position.y = 5.25;
                this.ballVelocity.y *= -0.8; 
            }     
            if (Math.abs(this.ball.position.z) >= 7 )        //check wall collisions
                this.ballWallCollision();
            this.checkPaddleCollision();
            this.limitBallSpeed();
            if(this.ball.position.x > 10 || this.ball.position.x < -10)
                this.resetBall();
            this.handleKeys();
        });

        this.engine.runRenderLoop(() => this.scene.render());
    }

    private limitBallSpeed(): void
    {
        const speed = this.ballVelocity.length();
        if(speed > this.maxSpeed)
            this.ballVelocity.normalize().scaleInPlace(this.maxSpeed);
    }

    private ballWallCollision(): void
    {
        this.ballVelocity.z *= -1;
        const minSpeedx = 0.15;
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
        this.ballVelocity.set(0,0,0);
        this.ball.position.set(0,5.5,0);
        this.ball.isVisible = true;
        const direction = Math.random() < 0.5 ? 1 : -1;
        this.ballVelocity = new BABYLON.Vector3(0.1 * direction, 0 , 0.05);

    }

    private delay(ms: number): Promise<void>
    {
        return new Promise((resolve) => setTimeout(resolve,ms));
    }

    private checkPaddleCollision() 
    {
        // Left paddle collision
        if (this.ball.intersectsMesh(this.paddle_left, false)) 
        {
            this.repositionPaddle();
            this.ballVelocity.x = Math.abs(this.ballVelocity.x); // Bounce right
            const hitOffset = this.ball.position.z - this.paddle_left.position.z;
            this.ballVelocity.z += hitOffset * 0.01;
        }
        // Right paddle collision
        if (this.ball.intersectsMesh(this.paddle_right, false)) 
        {
            this.repositionPaddle();
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x); // Bounce left
            const hitOffset = this.ball.position.z - this.paddle_right.position.z;
            this.ballVelocity.z += hitOffset * 0.1;
        }
    }

    private repositionPaddle(): void
    {
        this.paddle_left.position.y = 5.5;
        this.paddle_right.position.y = 5.5;
        this.paddle_left.position.x = -8;
        this.paddle_right.position.x = 8;
    }

   private changeCamera(): void 
   {
        if (this.scene.activeCamera === this.camera) 
        {
            this.scene.activeCamera.detachControl(this.canvas);
            this.scene.activeCamera = this.topCamera;
            this.scene.activeCamera.attachControl(this.canvas, true);
        } 
        else if(this.scene.activeCamera === this.topCamera)
        {
            this.scene.activeCamera.detachControl(this.canvas);
            this.scene.activeCamera = this.camera;
            this.scene.activeCamera.attachControl(this.canvas, true);
        }
    }

    private handleKeys(): void
    {
        //player1
        const moveVector = new BABYLON.Vector3(0, 0, 0);
        if (this.keys["a"]) 
            moveVector.z += 0.25;
        if (this.keys["d"]) 
            moveVector.z -= 0.25;
        //player2
        const moveVector2 = new BABYLON.Vector3(0, 0, 0);
        if (this.keys["4"]) 
            moveVector2.z += 0.25;
        if (this.keys["6"]) 
            moveVector2.z -= 0.25;
        if(this.keys["c"] && this.canChangeCamera)
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
