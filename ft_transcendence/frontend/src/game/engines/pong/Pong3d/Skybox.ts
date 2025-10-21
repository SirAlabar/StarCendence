// Skybox.ts
import * as BABYLON from '@babylonjs/core';
import "@babylonjs/loaders/glTF"; 

export class Skybox 
{
    static create(scene: BABYLON.Scene, texturePath: string): BABYLON.PhotoDome 
    {
        const dome = new BABYLON.PhotoDome(
            "skyDome",
            texturePath,
            {
                resolution: 16,
                size: 1000, // adjust to your scene scale
            },
            scene
        );
        return dome;
    }
}

