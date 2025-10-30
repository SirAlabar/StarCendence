// pages/PongPage.ts
import { BaseComponent } from '../components/BaseComponent';
import { gameManager } from '../game/managers/PongManager';
import { GameMode, Paddlecolor } from '../game/utils/GameTypes';
import { Pong3Dscene } from '@/game/engines/pong3D/Engine';

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
    private selectedMode: GameMode = 'local-multiplayer';
    private selectedDifficulty: 'easy' | 'hard' = 'easy';
    private selectedPaddle1Color: Paddlecolor = 'default';
    private selectedPaddle2Color: Paddlecolor = 'default';
    private pong3d!: Pong3Dscene;
    
    render(): string 
    {
        return `
            <div class="container mx-auto px-6 -mt-20 pt-20">
                <div class="flex items-center justify-center">
                    <div class="relative w-full max-w-7xl" style="aspect-ratio: 4/3; max-height: 80vh;">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                        ></canvas>
                    
                        <!-- Menu Overlay -->
                        <div id="pongMenuContainer" class="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-50">
                            <div id="mainMenu" class="flex flex-col space-y-3 bg-black/90 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/50">
                                ${this.renderModeSelection()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    private renderModeSelection(): string 
    {
        return `
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 Select Game Type</h1>
            <div class="flex flex-col space-y-4">
                <button id="mode2d" class="bg-cyan-600 text-white px-8 py-4 rounded-lg hover:bg-cyan-700 text-xl transition">
                    🕹️ 2D Pong
                </button>
                <button id="mode3d" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-xl transition">
                    🎮 3D Pong
                </button>
            </div>
            <button id="backBtn" class="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                ← Back to Games
            </button>
        `;
    }

    
    mount(): void 
    {
        this.attachModeSelectionListeners();

        gameManager.on('game:ended', (e: Event) => {
            const customEvent = e as CustomEvent;
            this.handleGameEnd(customEvent.detail.winner);
        });
        
        gameManager.on('game:goal', () => {
            console.log('⚽ GOAL!');
        });
    }

    
    private attachModeSelectionListeners(): void 
    {
        document.getElementById('mode2d')?.addEventListener('click', () => {
            this.showMainMenu(); // load existing 2D menu
        });

        document.getElementById('mode3d')?.addEventListener('click', () => {
            this.showMainMenu3d(); // load the 3D menu
        });

        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.goBack();
        });
    }

    private renderMainMenu(): string 
    {
        return `
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 Pong Game</h1>
            <div class="flex flex-col space-y-3">
                <button id="playLocal" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-xl transition">
                    🎮 Local Multiplayer
                </button>
                <button id="playAI" class="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 text-xl transition">
                    🤖 Play vs AI
                </button>
                <button id="playOnline" class="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-xl transition opacity-50 cursor-not-allowed" disabled>
                    🌐 Online Multiplayer (Coming Soon)
                </button>
                <button id="tournament" class="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 text-xl transition opacity-50 cursor-not-allowed" disabled>
                    🏆 Tournament (Coming Soon)
                </button>
                
            </div>
            <button id="backBtn" class="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                ← Back to Games
            </button>
        `;
    }

    private renderMainMenu3d(): string 
    {
        return `
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 Pong Game</h1>
            <div class="flex flex-col space-y-3">
                <button id="playLocal3d" class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-xl transition">
                    🎮 Local Multiplayer
                </button>
                <button id="playAI3d" class="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 text-xl transition">
                    🤖 Play vs AI
                </button>
                <button id="playOnline3d" class="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-xl transition opacity-50 cursor-not-allowed" disabled>
                    🌐 Online Multiplayer (Coming Soon)
                </button>
                <button id="tournament3d" class="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 text-xl transition opacity-50 cursor-not-allowed" disabled>
                    🏆 Tournament (Coming Soon)
                </button>
                
            </div>
            <button id="backBtn3d" class="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                ← Back to Games
            </button>
        `;
    }

    
    private renderColorSelection(forMultiplayer: boolean = false): string 
    {
        const colors: Array<{id: Paddlecolor, name: string, bg: string}> = 
        [
            { id: 'neon', name: '✨ Neon', bg: 'bg-yellow-500' },
            { id: 'fire', name: '🔥 Fire', bg: 'bg-red-600' },
            { id: 'ice', name: '❄️ Ice', bg: 'bg-blue-400' },
            { id: 'rainbow', name: '🌈 Rainbow', bg: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' },
            { id: 'matrix', name: '💚 Matrix', bg: 'bg-green-500' },
            { id: 'gold', name: '✨ Gold', bg: 'bg-yellow-600' },
            { id: 'shadow', name: '🌑 Shadow', bg: 'bg-gray-800' },
            { id: 'default', name: '⚪ Default', bg: 'bg-white' }
        ];
        
        const title = forMultiplayer 
            ? 'Select Paddle Colors' 
            : 'Select Your Paddle Color';
        
        const colorButtons = colors.map(color => `
            <button 
                data-color="${color.id}" 
                class="paddle-color-btn ${color.bg} text-white px-6 py-3 rounded-lg hover:scale-105 transition transform"
            >
                ${color.name}
            </button>
        `).join('');
        
        return `
            <h2 class="text-4xl font-bold mb-6 text-white">${title}</h2>
            ${forMultiplayer ? `
                <div class="mb-4 text-left">
                    <p class="text-cyan-400 text-sm mb-2">Player 1 Color: <span id="p1ColorDisplay" class="font-bold">${this.selectedPaddle1Color}</span></p>
                    <p class="text-pink-400 text-sm mb-2">Player 2 Color: <span id="p2ColorDisplay" class="font-bold">${this.selectedPaddle2Color}</span></p>
                </div>
            ` : ''}
            <div class="grid grid-cols-2 gap-3 mb-4">
                ${colorButtons}
            </div>
            ${forMultiplayer ? `
                <button id="startGameBtn" class="w-full bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 text-xl mb-2">
                    ▶️ Start Game
                </button>
            ` : ''}
            <button id="backBtn" class="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                ← Back
            </button>
        `;
    }
    
    private renderDifficultySelection(): string 
    {
        return `
            <h2 class="text-4xl font-bold mb-6 text-white">Select AI Difficulty</h2>
            <div class="flex flex-col space-y-4">
                <button id="easyBtn" class="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 text-xl transition">
                    😊 Easy
                    <div class="text-sm mt-1 opacity-80">Perfect for beginners</div>
                </button>
                <button id="hardBtn" class="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 text-xl transition">
                    😈 Hard
                    <div class="text-sm mt-1 opacity-80">Challenging opponent</div>
                </button>
            </div>
            <button id="backBtn" class="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                ← Back
            </button>
        `;
    }
    
  
    private attachMainMenuListeners(): void 
    {
        document.getElementById('playLocal')?.addEventListener('click', () => {
            this.selectedMode = 'local-multiplayer';
            this.showMultiplayerColorSelection();
        });
        
        document.getElementById('playAI')?.addEventListener('click', () => {
            this.selectedMode = 'ai';
            this.showDifficultySelection();
        });
        
        document.getElementById('playOnline')?.addEventListener('click', () => {
            alert('🚧 Online multiplayer coming soon!\nYour friend is working on the WebSocket server.');
        });
        
        document.getElementById('tournament')?.addEventListener('click', () => {
            alert('🚧 Tournament mode coming soon!');
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.backToFirstMenu();
        });

        document.getElementById('playOnline3d')?.addEventListener('click', () => {
            alert('🚧 Online multiplayer coming soon!');
        });
        
        document.getElementById('tournament3d')?.addEventListener('click', () => {
            alert('🚧 Tournament mode coming soon!');
        });
        
        document.getElementById('backBtn3d')?.addEventListener('click', () => {
            this.backToFirstMenu();
        });


        document.getElementById('playLocal3d')?.addEventListener('click', () => {
            this.selectedMode = 'local-multiplayer';
            this.showMultiplayerColorSelection3d();
        } )

        document.getElementById('playAI3d')?.addEventListener('click', () => {
            this.selectedMode = 'ai';
            this.showDifficultySelection3d();
        });
    }
    

    private backToFirstMenu(): void
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;

        mainMenu.innerHTML = this.renderModeSelection();
        this.attachModeSelectionListeners();
    }

    private start3DPong(mode: "ai" | "multiplayer"): void 
    {
        const menu = document.getElementById("pongMenuContainer");
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;

        if(menu)
            menu.style.display = "none";
        if(canvas)
        {
            console.log(mode);
            console.log(this.pong3d);
            gameManager.cleanup();
            if(mode === "multiplayer")
                this.pong3d = new Pong3Dscene(canvas, "multiplayer");
            else
                this.pong3d = new Pong3Dscene(canvas, "ai");

        }
    }

    private showDifficultySelection(): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;
        
        mainMenu.innerHTML = this.renderDifficultySelection();
        
        document.getElementById('easyBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'easy';
            this.showColorSelection(false);
        });
        
        document.getElementById('hardBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'hard';
            this.showColorSelection(false);
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    private showDifficultySelection3d(): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;
        
        mainMenu.innerHTML = this.renderDifficultySelection();
        
        document.getElementById('easyBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'easy';
            this.showColorSelection3d(false);
        });
        
        document.getElementById('hardBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'hard';
            this.showColorSelection3d(false);
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.showMainMenu3d();
        });
    }
    
    private showColorSelection(forMultiplayer: boolean): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;
        
        mainMenu.innerHTML = this.renderColorSelection(forMultiplayer);
        
        const colorButtons = mainMenu.querySelectorAll('.paddle-color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const color = target.dataset.color as Paddlecolor;
                
                if (forMultiplayer) 
                {
                    
                    if (this.selectedPaddle1Color === 'default') 
                    {
                        this.selectedPaddle1Color = color;
                        gameManager.setPaddleColor(1, color);
                        this.updateColorDisplays();
                    } 
                    else if (this.selectedPaddle2Color === 'default') 
                    {
                        this.selectedPaddle2Color = color;
                        gameManager.setPaddleColor(2, color);
                        this.updateColorDisplays();
                    } 
                    else 
                    {
                        this.selectedPaddle1Color = this.selectedPaddle2Color;
                        this.selectedPaddle2Color = color;
                        gameManager.setPaddleColor(1, this.selectedPaddle1Color);
                        gameManager.setPaddleColor(2, color);
                        this.updateColorDisplays();
                    }
                } 
                else 
                {
                    // For AI mode, just select paddle color and start
                    this.selectedPaddle1Color = color;
                    gameManager.setPaddleColor(1, color);
                    this.startGame();
                }
            });
        });
        
        if (forMultiplayer) 
        {
            document.getElementById('startGameBtn')?.addEventListener('click', () => {
                if (this.selectedPaddle1Color === 'default' || this.selectedPaddle2Color === 'default') {
                    alert('Please select colors for both players!');
                    return;
                }
                this.startGame();
            });
        }
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.selectedPaddle1Color = 'default';
            this.selectedPaddle2Color = 'default';
            
            if (this.selectedMode === 'ai') 
            {
                this.showDifficultySelection();
            } 
            else 
            {
                this.showMainMenu();
            }
        });
    }
    
    private showColorSelection3d(forMultiplayer: boolean): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) 
            return;
        
        mainMenu.innerHTML = this.renderColorSelection(forMultiplayer);
        
        const colorButtons = mainMenu.querySelectorAll('.paddle-color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const color = target.dataset.color as Paddlecolor;
                
                if (forMultiplayer) 
                {
                    
                    if (this.selectedPaddle1Color === 'default') 
                    {
                        this.selectedPaddle1Color = color;
                        gameManager.setPaddleColor(1, color);
                        this.updateColorDisplays();
                    } 
                    else if (this.selectedPaddle2Color === 'default') 
                    {
                        this.selectedPaddle2Color = color;
                        gameManager.setPaddleColor(2, color);
                        this.updateColorDisplays();
                    } 
                    else 
                    {
                        this.selectedPaddle1Color = this.selectedPaddle2Color;
                        this.selectedPaddle2Color = color;
                        gameManager.setPaddleColor(1, this.selectedPaddle1Color);
                        gameManager.setPaddleColor(2, color);
                        this.updateColorDisplays();
                    }
                } 
                else 
                {
                    // For AI mode, just select paddle color and start
                    this.selectedPaddle1Color = color;
                    gameManager.setPaddleColor(1, color);
                    this.start3DPong('ai');
                }
            });
        });
        
        if (forMultiplayer) 
        {
            document.getElementById('startGameBtn')?.addEventListener('click', () => {
                if (this.selectedPaddle1Color === 'default' || this.selectedPaddle2Color === 'default') {
                    alert('Please select colors for both players!');
                    return;
                }
                this.start3DPong("multiplayer");
            });
        }
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.selectedPaddle1Color = 'default';
            this.selectedPaddle2Color = 'default';
            
            if (this.selectedMode === 'ai') 
            {
                this.showDifficultySelection3d();
            } 
            else 
            {
                this.showMainMenu3d();
            }
        });
    }

    private showMultiplayerColorSelection(): void 
    {
        this.showColorSelection(true);
    }

    private showMultiplayerColorSelection3d(): void 
    {
        this.showColorSelection3d(true);
    }
    
    private updateColorDisplays(): void 
    {
        const p1Display = document.getElementById('p1ColorDisplay');
        const p2Display = document.getElementById('p2ColorDisplay');
        
        if (p1Display) 
        {
            p1Display.textContent = this.selectedPaddle1Color.toUpperCase();
        }
        if (p2Display) 
        {
            p2Display.textContent = this.selectedPaddle2Color.toUpperCase();
        }
    }

    
    
    private showMainMenu(): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) 
            return;
        
        mainMenu.innerHTML = this.renderMainMenu();
        this.attachMainMenuListeners();
    }

    private showMainMenu3d(): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) 
            return;
        
        mainMenu.innerHTML = this.renderMainMenu3d();
        this.attachMainMenuListeners();
    }
    
    private async startGame(): Promise<void> 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            console.error('Canvas not found');
            return;
        }
        
        // Hide menu
        if (menu) 
        {
            menu.style.display = 'none';
        }
        
        // Resize canvas to fit container
        this.resizeCanvas(canvas);
        
        // Initialize game 
        try 
        {
            await gameManager.initGame(canvas, 
            {
                mode: this.selectedMode,
                difficulty: this.selectedMode === 'ai' ? this.selectedDifficulty : undefined,
                paddlecolor1: this.selectedPaddle1Color,
                paddlecolor2: this.selectedPaddle2Color, 
                gamewidth: canvas.width,                 
                gameheight: canvas.height 
            });
            
            gameManager.startGame();
            
           
            this.setupResizeListener(canvas);
            
        } 
        catch (error) 
        {
            console.error('Failed to start game:', error);
            alert('Failed to start game. Please try again.');
            this.showMainMenu();
            if (menu) menu.style.display = 'flex';
        }
    }
    
    private handleGameEnd(winner: 'player1' | 'player2'): void 
    {
        const winnerName = winner === 'player1' ? 'Player 1' : 
                          (this.selectedMode === 'ai' ? 'AI' : 'Player 2');
        
        console.log(` ${winnerName} wins!`);
        
       
        setTimeout(() => {
            const menu = document.getElementById('pongMenuContainer');
            if (menu) {
                menu.style.display = 'flex';
            }
            
            // Reset selections
            this.selectedPaddle1Color = 'default';
            this.selectedPaddle2Color = 'default';
            
            this.showMainMenu();
        }, 2000);
    }
    
    
    
    private resizeCanvas(canvas: HTMLCanvasElement): void 
    {
        const container = canvas.parentElement;
        if (!container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    private setupResizeListener(canvas: HTMLCanvasElement): void 
    {
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
        }
        
        this.resizeListener = () => {
            if (!canvas) return;
            
            const container = canvas.parentElement;
            if (!container) return;
            
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            
            gameManager.pauseGame();
            canvas.width = newWidth;
            canvas.height = newHeight;
            // Note: You'll need to add resize method to your game manager
            gameManager.resumeGame();
        };
        
        window.addEventListener('resize', this.resizeListener);
    }
    
    private goBack(): void 
    {
        this.dispose();
        
        if ((window as any).navigateTo) {
            (window as any).navigateTo('/games');
        }
    }
    
  
    
    public dispose(): void 
    {
        gameManager.cleanup();
        
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }
}