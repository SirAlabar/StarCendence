import { BaseComponent } from '../components/BaseComponent';
import { navigateTo } from '@/router/router';
import { PongScene } from '@/game/engines/pong/PongScene';
import { neonBackgroundStyles } from '@/game/engines/pong/entities/backgroundcolor';

export default class PongPage extends BaseComponent 
{
  private pongScene: PongScene | null = null;

  render(): string {
    return `
      <div class="pong-selection-overlay fixed inset-0 z-50 flex items-center justify-center neon-background">
        <div class="max-w-4xl w-full p-8 relative">
          <canvas 
            id="pongCanvas" 
            class="w-full h-full block"
            style="background: transparent; display: none;"
          ></canvas>

          <!-- Main Menu Container -->
          <div id="pongMenuContainer" class="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 Pong Game</h1>

            <div id="mainMenu" class="flex flex-col space-y-3">
              <button id="start2DPongBtn" class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700">
                Play 2D Pong
              </button>
              <button id="start3DPongBtn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Play 3D Pong
              </button>
            </div>

            <button id="backBtn" class="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
              Back to Games
            </button>
          </div>
        </div>
        <style>${neonBackgroundStyles}</style>
      </div>
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
      <button id="playWithAI" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
        Play vs AI
      </button>
      <button id="playMultiplayer" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
        Multiplayer (2 Players)
      </button>
      <button id="backToMainMenu" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
        ← Back
      </button>
    `;

    // Rebind event listeners for new buttons
    document.getElementById("playWithAI")?.addEventListener("click", () => this.start2DPong("ai"));
    document.getElementById("playMultiplayer")?.addEventListener("click", () => this.start2DPong("multiplayer"));
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
    if (canvas) {
      this.resize(canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // You can pass mode info to PongScene later (e.g., AI logic)
      this.pongScene = new PongScene(ctx);
      console.log(`Starting 2D Pong in mode: ${mode}`);
      this.pongScene.start();
    }

    window.addEventListener("resize", () => 
      {
      if (canvas && this.pongScene) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });
  }

  resize(canvas: HTMLCanvasElement) 
  {
    canvas.style.display = "block";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private start3DPong(): void 
  {
    alert("🚧 3D Pong coming soon!");
  }

  private goBack(): void 
  {
    this.dispose();
    navigateTo('/games');
  }

  public dispose(): void 
  {
    this.pongScene = null;
  }
}



