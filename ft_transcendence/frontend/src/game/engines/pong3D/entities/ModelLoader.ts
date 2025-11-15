// entities/ModelLoader.ts
import "@babylonjs/loaders";
import { Scene, SceneLoader, Vector3, AbstractMesh } from "@babylonjs/core";

export async function loadModel(scene: Scene, directory: string, filename: string, position: Vector3 = new Vector3(0, 0, 0)): Promise<AbstractMesh[]> 
{
  const result = await SceneLoader.ImportMeshAsync
  (
    "", 
    directory, 
    filename, 
    scene
  );
  result.meshes.forEach(mesh => mesh.position = position.clone());
  return result.meshes;
}


