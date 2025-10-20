import { bayerDitherFunctions } from "@babylonjs/core/Shaders/ShadersInclude/bayerDitherFunctions";
import * as BABYLON from "babylonjs"


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
        
        //create scene
        this.scene = new  BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0,0,0,1);

        //setup camera
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(-10,2,0), this.scene);
        
        //setup lights
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), this.scene);
        this.light.intensity = 0.8;
        
        
        //ground setup(floor)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 12}, this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        
        
        //ball setup
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 1}, this.scene);
        this.ball.position = new BABYLON.Vector3(0, 1, 0);

        //Padles setup
        this.paddle_left = BABYLON.MeshBuilder.CreateBox("left_paddle", {width: 0.4, height: 1, depth: 2}, this.scene);
        this.paddle_left.position = new BABYLON.Vector3(-8, 0.5, 0);
        
        this.paddle_right = BABYLON.MeshBuilder.CreateBox("right_paddle", {width: 0.4, height: 1, depth: 2}, this.scene);
        this.paddle_right.position = new BABYLON.Vector3(8, 0.5, 0);
        
        this.camera.parent = this.paddle_left;

        //Materials
        const mat = new BABYLON.StandardMaterial("mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0,0.5,0.5);
        this.ball.material = mat;
        this.paddle_left.material = mat;
        this.paddle_right.material = mat;

        //ground color
        const greenmat = new BABYLON.StandardMaterial("greenmat", this.scene);
        greenmat.diffuseColor = new BABYLON.Color3(0.26, 0.89, 0.07);
        ground.material = greenmat;

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