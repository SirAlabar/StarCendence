import { BaseComponent } from '../components/BaseComponent';
import { AiDifficulty } from '@/game/engines/pong/entities/EnemyAi';
import { gameManager } from '@/game/managers/PongManager';
import { Pong3Dscene } from '@/game/engines/pong/Pong3d/Engine';

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
    private selectedDifficulty: AiDifficulty = 'easy'; 
    private gameEndHandler: ((event: Event) => void) | null = null;
    private pong3D: Pong3Dscene | null = null

      render(): string 
      {
        return `
            <div class="container mx-auto px-6 -mt-20 pt-20">
                <!-- Centered Canvas Container with 4:3 aspect ratio -->
                <div class="flex items-center justify-center">
                    <!-- allow vertical resize to constrain the board -->
                    <div class="relative w-full max-w-7xl" style="aspect-ratio: 4/3; max-height: 80vh;">
                         <canvas 
                             id="pongCanvas" 
                             class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                         ></canvas>
                       
                       <!-- Menu Overlay -->
                       <div id="pongMenuContainer" class="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-50">
                            <div id="mainMenu" class="flex flex-col space-y-3 bg-black/90 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/50">
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
                </div>
            </div>
        `;
    }

    mount(): void 
    {
        this.attachMainMenuListeners();
        this.gameEndHandler = this.handleGameEnd.bind(this);
        window.addEventListener('gameManager:showMenu', this.gameEndHandler);
    }

    private attachMainMenuListeners(): void 
    {
        const start2D = document.getElementById("start2DPongBtn");
        const start3D = document.getElementById("start3DPongBtn");
        const backBtn = document.getElementById("backBtn");

        if (start2D) 
        {
            start2D.addEventListener("click", () => this.show2DModeSelection());
        }
        if (start3D) 
        {
            start3D.addEventListener("click", () => this.show3DModeSelection());
        }
        if (backBtn) 
        {
            backBtn.addEventListener("click", () => this.goBack());
        }
    }

    private show2DModeSelection(): void 
    {
        const mainMenu = document.getElementById("mainMenu");
        if (!mainMenu) 
            return;


        mainMenu.innerHTML = `
            <h2 class="text-4xl font-bold mb-6 text-white">Select Game Mode</h2>
            <div class="flex flex-col space-y-4">
                <button id="playMultiplayer" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-xl">
                    🎮 Multiplayer (Local)
                </button>
                <button id="playWithAI" class="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 text-xl">
                    🤖 Play vs AI
                </button>
                <button id="tournament" class="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 text-xl">
                    🏆 Tournament
                </button>
                <button id="backToMainMenu" class="mt-4 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                    ← Back
                </button>
            </div>
        `;

        document.getElementById("playWithAI")?.addEventListener("click", () => this.showAIDifficultySelection());
        document.getElementById("playMultiplayer")?.addEventListener("click", () => this.start2DPong("multiplayer"));
        document.getElementById("tournament")?.addEventListener("click", () => this.tournamentbtn());
        document.getElementById("backToMainMenu")?.addEventListener("click", () => this.renderMainMenu());
    }

    private show3DModeSelection(): void 
    {
        const mainMenu = document.getElementById("mainMenu");
        if (!mainMenu) 
            return;


        mainMenu.innerHTML = `
            <h2 class="text-4xl font-bold mb-6 text-white">Select Game Mode</h2>
            <div class="flex flex-col space-y-4">
                <button id="playMultiplayer" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-xl">
                    🎮 Multiplayer (Local)
                </button>
                <button id="playWithAI" class="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 text-xl">
                    🤖 Play vs AI
                </button>
                <button id="tournament" class="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 text-xl">
                    🏆 Tournament
                </button>
                <button id="backToMainMenu" class="mt-4 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                    ← Back
                </button>
            </div>
        `;

        document.getElementById("playWithAI")?.addEventListener("click", () => this.comingSoon());
        document.getElementById("playMultiplayer")?.addEventListener("click", () => this.start3DPong());
        document.getElementById("tournament")?.addEventListener("click", () => this.tournamentbtn());
        document.getElementById("backToMainMenu")?.addEventListener("click", () => this.renderMainMenu());
    }

    private showAIDifficultySelection(): void 
    {
        const mainMenu = document.getElementById("mainMenu");
        if (!mainMenu) 
            return;


        mainMenu.innerHTML = `
            <h2 class="text-4xl font-bold mb-6 text-white">Select AI Difficulty</h2>
            <div class="flex flex-col space-y-4">
                <button id="easyBtn" class="bg-yellow-500 text-white px-8 py-4 rounded-lg hover:bg-yellow-600 text-xl">
                    😐 Easy
                    <div class="text-sm mt-1 opacity-80">Balanced gameplay</div>
                </button>
                <button id="hardBtn" class="bg-red-500 text-white px-8 py-4 rounded-lg hover:bg-red-600 text-xl">
                    😈 Hard
                    <div class="text-sm mt-1 opacity-80">Accurate predictions, tough to beat</div>
                </button>
                <button id="backToModeSelect" class="mt-4 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                    ← Back
                </button>
            </div>
        `;

        document.getElementById("easyBtn")?.addEventListener("click", () => 
        {
            this.selectedDifficulty = 'easy';
            this.start2DPong("ai");
        });
        document.getElementById("hardBtn")?.addEventListener("click", () => 
        {
            this.selectedDifficulty = 'hard';
            this.start2DPong("ai");
        });
        document.getElementById("backToModeSelect")?.addEventListener("click", () => this.show2DModeSelection());
    }

    private renderMainMenu(): void 
    {
        const mainMenu = document.getElementById("mainMenu");
        if (!mainMenu) 
        {
            return;
        }

        mainMenu.innerHTML = `
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
        `;

        this.attachMainMenuListeners();
    }

    private start2DPong(mode: "ai" | "multiplayer"): void 
    {
        const menu = document.getElementById("pongMenuContainer");
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
        
        if (menu) 
        {
            menu.style.display = "none";
        }

        if (canvas) 
        {
            this.resize(canvas);
            
            // Initialize game through GameManager
            const config = mode === "ai" 
                ? { mode, difficulty: this.selectedDifficulty }
                : { mode };
                
            gameManager.initGame(canvas, config);
            gameManager.startGame();
            
            // Setup resize listener
            if (this.resizeListener) 
            {
                window.removeEventListener("resize", this.resizeListener);
            }
            
            this.resizeListener = () => 
                {
                    if (!canvas) 
                        return;
                    gameManager.pauseGame();
                    const container = canvas.parentElement;
                    if (!container) 
                        return;
                    const newWidth = container.clientWidth;
                    const newHeight = container.clientHeight;
                    gameManager.resizeGame(newWidth, newHeight);
                    gameManager.redraw();
                };
            
            window.addEventListener("resize", this.resizeListener);
        }
    }

    resize(canvas: HTMLCanvasElement) 
    {
        const container = canvas.parentElement;
        if (!container) 
        {
            return;
        }
        
        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas to match container (which has 4:3 aspect-ratio from CSS)
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    }

    private handleGameEnd(event: Event): void 
    {
        const customEvent = event as CustomEvent;
        const winner = customEvent.detail.winner;
        
        console.log(`${winner} won the game!`);
        
        // Show menu again
        const menu = document.getElementById("pongMenuContainer");
        
        if (menu) 
        {
            menu.style.display = "flex";
        }
        
        // Reset to main menu
        this.renderMainMenu();
    }

    private start3DPong(): void 
    {
        const menu = document.getElementById("pongMenuContainer");
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;

        if(menu)
            menu.style.display = "none";
        if(canvas)
        {
            gameManager.cleanup();
            this.pong3D = new Pong3Dscene(canvas);
        }
    }

    private tournamentbtn(): void
    {
        alert("🚧 Tournament coming soon!")
    }

    private comingSoon(): void
    {
        alert("🚧Coming Soon!");
    }
    private goBack(): void 
    {
        this.dispose();
        
        // Use SPA navigation
        if ((window as any).navigateTo) 
        {
            (window as any).navigateTo('/games');
        }
    }

    public dispose(): void 
    {
        // Cleanup GameManager
        gameManager.cleanup();
        
        if(this.pong3D)
        {
            this.pong3D.dispose();
            this.pong3D = null;
        }

        // Remove event listener
        if (this.gameEndHandler) 
        {
            window.removeEventListener('gameManager:showMenu', this.gameEndHandler);
            this.gameEndHandler = null;
        }
        
        if (this.resizeListener) 
        {
            window.removeEventListener("resize", this.resizeListener);
            this.resizeListener = null;
        }
    }

    
}