// Skybox.ts
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Skybox {
    static async createFromGLB(scene: BABYLON.Scene, glbPath: string): Promise<void> 
    {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                glbPath.substring(0, glbPath.lastIndexOf("/") + 1), 
                glbPath.split("/").pop()!, 
                scene
            );

            const skyMesh = result.meshes[0];
            skyMesh.scaling = new BABYLON.Vector3(1000, 1000, 1000); // make it big
            skyMesh.isPickable = false;
            skyMesh.checkCollisions = false;
            skyMesh.material!.backFaceCulling = false;
        } 
        catch (error)
        {

        }
    }
}

