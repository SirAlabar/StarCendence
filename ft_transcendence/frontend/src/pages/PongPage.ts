import { HtmlElementTexture } from '@babylonjs/core';
import { BaseComponent } from '../components/BaseComponent';
import { PongScene  } from '../game/engines/pong/PongScene';
import { navigateTo } from '@/router/router';


export default class PongPage extends BaseComponent 
{
    private pongScene: PongScene | null = null;

    render(): string {
    return `
      <div class="h-screen w-full relative">
        <!-- Canvas -->
        <canvas 
          id="pongCanvas" 
          class="w-full h-full block"
          style="background: black; display: none;"
        ></canvas>

        <!-- Menu Container -->
        <div id="pongMenuContainer" class="flex flex-col items-center justify-center h-full text-center">
          <h1 class="text-5xl font-bold mb-6 text-white">🏓 2D Pong</h1>
          <button id="startPongBtn" class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 mb-4">
            Start Game
          </button>
          <button id="backBtn" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
            Back to Games
          </button>
        </div>
      </div>
    `;
    }
    
    mount():void
    {
        (window as any).pongPage = this;
        this.setupListeners();
        this.setupCleanup();
    }

    private setupListeners(): void
    {
        const startBtn = document.getElementById("startPongBtn");
        const backBtn = document.getElementById("backBtn");

        if(startBtn)
        {
            startBtn.addEventListener("click", ()=> this.startGame());
        }
        if(backBtn)
        {
            backBtn.addEventListener("click", ()=> this.goBack());
        }
    }

    private setupCleanup(): void 
    {
        window.addEventListener('beforeunload', () => this.dispose());
    }

    private startGame(): void
    {
        const menu = document.getElementById("pongMenuContainer");
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;

        if(menu) menu.style.display = 'none';
        if(canvas) canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        if(ctx)
        {
            this.pongScene = new PongScene(ctx);
            this.pongScene.start();
        }
    }


    public goBack(): void
    {
        this.dispose();
        navigateTo('/games');
    }
    
    public dispose(): void
    {
        if(this.pongScene)
        {
            this.pongScene = null;
        }
        if ((window as any).pongPage == this)
        {
            delete(window as any).pongPage;
        }
    }

}


