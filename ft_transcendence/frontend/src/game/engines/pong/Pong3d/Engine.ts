import * as BABYLON from "@babylonjs/core";
import { Skybox } from "./Skybox";

export class Pong3Dscene 
{
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera!: BABYLON.FreeCamera;
    private light!: BABYLON.HemisphericLight;
    private ball!: BABYLON.Mesh;
    private paddle_left!: BABYLON.Mesh;
    private paddle_right!: BABYLON.Mesh;

    private keys: Record<string, boolean> = {};

    constructor(private canvas: HTMLCanvasElement) {
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

        const leftWall = BABYLON.MeshBuilder.CreateBox("left_wall", { width: 0.5, height: 3, depth: 20 }, this.scene);
        leftWall.position = new BABYLON.Vector3(0, 1.5, 10);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.material = wallMat;

        const rightWall = leftWall.clone("right_wall");
        rightWall.position = new BABYLON.Vector3(0, 1.5, -10);
        rightWall.material = wallMat;

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

        this.paddle_left.checkCollisions = true;
        this.paddle_right.checkCollisions = true;
    }

    private setupGameLoop() 
    {
        this.scene.onBeforeRenderObservable.add(() => {
            const moveVector = new BABYLON.Vector3(0, 0, 0);
            if (this.keys["a"]) moveVector.z += 0.1;
            if (this.keys["d"]) moveVector.z -= 0.1;
            this.paddle_left.moveWithCollisions(moveVector);
        });

        this.engine.runRenderLoop(() => this.scene.render());
    }

    dispose() 
    {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}
