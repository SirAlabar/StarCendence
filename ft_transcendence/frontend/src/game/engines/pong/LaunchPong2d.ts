import { PongScene } from "./PongScene.ts"


//will call PongScene Constructor
export function launchPong2d(container: HTMLElement) 
{
    // Clear previous content
    container.innerHTML = "";

    // Create canvas dynamically
    const canvas = document.createElement("canvas");
    canvas.style.borderRadius = "12px";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    // Dynamically fit to container
    const resizeCanvas = () => 
    {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start the scene
    const ctx = canvas.getContext("2d");
    if (ctx) 
    {
        console.log("🎮 PongScene starting...");
        const game = new PongScene(ctx);
        game.start();
    } 
    else 
        console.error("❌ Could not get 2D context");
}