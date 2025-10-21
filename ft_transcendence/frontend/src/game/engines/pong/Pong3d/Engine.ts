import * as BABYLON from '@babylonjs/core';
import { Skybox } from "./Skybox";


export class Pong3Dscene
{
    private engine: BABYLON.Engine;         //engine
    private scene: BABYLON.Scene;
    private camera: BABYLON.FreeCamera;
    private light: BABYLON.HemisphericLight;
    private ball: BABYLON.Mesh;
    private paddle_left: BABYLON.Mesh;
    private paddle_right: BABYLON.Mesh

    constructor(private canvas: HTMLCanvasElement)
    {
        //start engine
        this.engine = new BABYLON.Engine(canvas, true);
        
        //avoid error
        console.log(this.canvas);
        //create scene
        this.scene = new  BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0,0,0,1);

        //check keys
        const keys: Record<string, boolean> = {};
        this.scene.onKeyboardObservable.add((kbInfo) =>{
            switch(kbInfo.type){
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    keys[kbInfo.event.key.toLowerCase()] = true;
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    keys[kbInfo.event.key.toLowerCase()] = false;
                    break;
            }
        })
        //setup camera
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(-10,2,0), this.scene);
        
        //setup lights
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), this.scene);
        this.light.intensity = 0.8;
        
        
        //ground setup(floor)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, this.scene);
        
        //wall setup
        const leftWall = BABYLON.MeshBuilder.CreateBox("left_wall", {width: 0.5, height:3, depth:20}, this.scene);
        leftWall.position = new BABYLON.Vector3(0,1,10);
        leftWall.rotation.y = Math.PI / 2;
        const rightWall = leftWall.clone("right_wall");
        rightWall.position = new BABYLON.Vector3(0,1,-10);
        
        this.camera.setTarget(BABYLON.Vector3.Zero());
        
        //ball setup
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 0.5}, this.scene);
        this.ball.position = new BABYLON.Vector3(0, 1, 0);

        //Padles setup
        this.paddle_left = BABYLON.MeshBuilder.CreateBox("left_paddle", {width: 0.4, height: 1, depth: 2}, this.scene);
        this.paddle_left.position = new BABYLON.Vector3(-8, 0.5, 0);
        
        this.paddle_right = BABYLON.MeshBuilder.CreateBox("right_paddle", {width: 0.4, height: 1, depth: 2}, this.scene);
        this.paddle_right.position = new BABYLON.Vector3(8, 0.5, 0);
        
        //set camera to follow paddle
        this.camera.parent = this.paddle_left;
        this.camera.position = new BABYLON.Vector3(-12, 2, 0);
        this.camera.setTarget(this.paddle_left.position.add(new BABYLON.Vector3(10,0,0)));

        //Materials
        const mat = new BABYLON.StandardMaterial("mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0,0.5,0.5);
        this.paddle_left.material = mat;
        this.paddle_right.material = mat;
        leftWall.material = mat;
        rightWall.material = mat;
        
        //ground color
        const greenmat = new BABYLON.StandardMaterial("greenmat", this.scene);
        greenmat.diffuseColor = new BABYLON.Color3(0.26, 0.89, 0.07);
        ground.material = greenmat;
        
        //ball color
        const ballColor = new BABYLON.StandardMaterial("ballcolor", this.scene);
        ballColor.diffuseColor = new BABYLON.Color3(1,1,1);
        this.ball.material = ballColor;

        //skybox
        Skybox.create(this.scene, "assets/images/skytest.hdr")
        
        //collision
        this.paddle_left.checkCollisions = true;
        this.paddle_left.ellipsoid = new BABYLON.Vector3(0.2, 0.5, 1); // half-size of your paddle
        this.paddle_left.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0); // center it vertically

        leftWall.checkCollisions = true;
        rightWall.checkCollisions = true;
        this.scene.collisionsEnabled = true;
        ground.checkCollisions = true;
      
        

        // Movement with collisions
        this.scene.onBeforeRenderObservable.add(() => {
            const moveVector = new BABYLON.Vector3(0, 0, 0);

            if (keys["a"]) moveVector.z += 0.1;  // move left
            if (keys["d"]) moveVector.z -= 0.1;  // move right

            this.paddle_left.moveWithCollisions(moveVector);
        });

        //simple start up to test
        this.engine.runRenderLoop(() =>{
            this.scene.render();
        })

        //resize
        window.addEventListener("resize", ()=>{
            this.engine.resize();
        });

    }

    dispose(): void
    {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}