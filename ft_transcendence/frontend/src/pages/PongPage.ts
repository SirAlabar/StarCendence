import { BaseComponent } from '../components/BaseComponent';

import { PongScene } from '@/game/engines/pong/PongScene';
import { neonBackgroundStyles } from '@/game/engines/pong/entities/backgroundcolor';

export default class PongPage extends BaseComponent 
{
  private pongScene: PongScene | null = null;
  private resizeListener: (() => void) | null = null;

  render(): string {
    return `
      <div class="relative w-full h-[80vh] max-w-4xl mx-auto flex items-center justify-center">
        <canvas 
          id="pongCanvas" 
          class="w-full h-full rounded-2xl border border-cyan-500 bg-black"
        ></canvas>
        <div id="pongMenuContainer" class="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-40">
          <!-- Main Menu Container -->
          <div id="mainMenu" class="flex flex-col space-y-3">
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 Pong Game</h1>

            <div class="flex flex-col space-y-3">
              <button id="start2DPongBtn" class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700">
                Play 2D Pong
              </button>
              <button id="start3DPongBtn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Play 3D Pong
              </button>
            </div>

            <button id="backBtn" class="mt-6 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
              Back to Games
            </button>
          </div>
        </div>
      </div>
      <style>${neonBackgroundStyles}</style>
    `;
  }

  mount(): void 
  {
    this.attachMainMenuListeners();
  }

  private attachMainMenuListeners(): void 
  {
    const start2D = document.getElementById("start2DPongBtn");
    const start3D = document.getElementById("start3DPongBtn");
    const backBtn = document.getElementById("backBtn");
    

    if (start2D) start2D.addEventListener("click", () => this.show2DModeSelection());
    if (start3D) start3D.addEventListener("click", () => this.start3DPong());
    if (backBtn) backBtn.addEventListener("click", () => this.goBack());
  }

  
  private show2DModeSelection(): void 
  {
    const mainMenu = document.getElementById("mainMenu");
    if (!mainMenu) return;

    
   mainMenu.innerHTML = `
    <div class="flex justify-between w-full px-12 items-center">
    <!-- Left side -->
    <div class="flex flex-col space-y-10 text-left">
      <button id="playMultiplayer" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 w-56">
        Multiplayer
      </button>
      <button id="tournament" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-56">
        Tournament
      </button>
    </div>
    <!-- Right side -->
    <div class="flex justify-between w-full px-6 items-center">
      <button id="playWithAI" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 w-56">
        Play vs AI
        </div>
  </div>
 `;

    // Rebind event listeners for new buttons
    document.getElementById("playWithAI")?.addEventListener("click", () => this.start2DPong("ai"));
    document.getElementById("playMultiplayer")?.addEventListener("click", () => this.start2DPong("multiplayer"));
    document.getElementById("tournament")?.addEventListener("click", () => this.tournamentbtn());
    document.getElementById("backToMainMenu")?.addEventListener("click", () => this.renderMainMenu());
  }

  
  private renderMainMenu(): void 
  {
    const mainMenu = document.getElementById("mainMenu");
    if (!mainMenu) return;

    mainMenu.innerHTML = `
      <button id="start2DPongBtn" class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700">
        Play 2D Pong
      </button>
      <button id="start3DPongBtn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
        Play 3D Pong
      </button>
    `;

    this.attachMainMenuListeners();
  }

  
 
  private start2DPong(mode: "ai" | "multiplayer"): void 
{
  const menu = document.getElementById("pongMenuContainer");
  const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
  if (menu) menu.style.display = "none";

  if (canvas) 
  {
    this.resize(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    this.pongScene = new PongScene(ctx, mode);
    this.pongScene.start();

    // Remove previous listener if any
    if (this.resizeListener) 
      window.removeEventListener("resize", this.resizeListener);

    // Pause only, do not auto-resume
    this.resizeListener = () => 
    {
      if (this.pongScene)
      {
        this.pongScene.stop(); // Pause on resize
      }
      this.resize(canvas);
      
    };
    window.addEventListener("resize", this.resizeListener);
  }
}

  resize(canvas: HTMLCanvasElement) 
  {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  private start3DPong(): void 
  {
    alert("🚧 3D Pong coming soon!");
  }

  private tournamentbtn(): void
  {
    alert("🚧 Tournament coming soon!")
  }

  private goBack(): void 
  {
    this.dispose();
    window.location.href = '/games';
  }

  public dispose(): void 
  {
    if(this.pongScene)
    {
      this.pongScene.stop();
    }
    this.pongScene = null;
  }
}



