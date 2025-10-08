import { PongScene } from "./PongScene.ts"

export function launchPong2d(container: HTMLElement)
{
    //clear container
    container.innerHTML = "";

    //create canvas
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.background = "black";
    canvas.style.borderRadius = "12px";
    container.appendChild(canvas);
console.log("success")
    const ctx = canvas.getContext("2d");
    if(ctx)
    {
        console.log("success")
        const game = new PongScene(ctx);
        game.start();
    }
}