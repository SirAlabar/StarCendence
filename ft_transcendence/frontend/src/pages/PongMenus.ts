// components/PongMenu.ts
import { gameManager } from '../game/managers/PongManager';
import { GameMode, Paddlecolor } from '../game/utils/GameTypes';

export type MenuType = 'mode-selection' | 'main-2d' | 'main-3d' | 'difficulty' | 'color-selection';

export interface MenuCallbacks 
{
    onStart2DGame: () => void;
    onStart3DGame: (mode: 'ai' | 'multiplayer') => void;
    onBackToGames: () => void;
}

export class PongMenu 
{
    private selectedMode: GameMode = 'local-multiplayer';
    private selectedDifficulty: 'easy' | 'hard' = 'easy';
    private selectedPaddle1Color: Paddlecolor = 'default';
    private selectedPaddle2Color: Paddlecolor = 'default';
    private currentMenu: MenuType = 'mode-selection';
    private is3DMode: boolean = false;
    private callbacks: MenuCallbacks;

    constructor(callbacks: MenuCallbacks) 
    {
        this.callbacks = callbacks;
    }

    // Public method to show the initial menu
    public showModeSelection(): void 
    {
        this.currentMenu = 'mode-selection';
        this.updateMenu();
    }

    // Public method to get current selections
    public getSelections() 
    {
        return {
            mode: this.selectedMode,
            difficulty: this.selectedDifficulty,
            paddle1Color: this.selectedPaddle1Color,
            paddle2Color: this.selectedPaddle2Color,
            is3D: this.is3DMode
        };
    }

    // Public method to reset selections
    public resetSelections(): void 
    {
        this.selectedPaddle1Color = 'default';
        this.selectedPaddle2Color = 'default';
        this.selectedMode = 'local-multiplayer';
        this.selectedDifficulty = 'easy';
    }

    // Main render method
    private updateMenu(): void 
    {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;

        let html = '';
        switch (this.currentMenu) 
        {
            case 'mode-selection':
                html = this.renderModeSelection();
                break;
            case 'main-2d':
                html = this.renderMainMenu();
                break;
            case 'main-3d':
                html = this.renderMainMenu3d();
                break;
            case 'difficulty':
                html = this.renderDifficultySelection();
                break;
            case 'color-selection':
                html = this.renderColorSelection(this.selectedMode === 'local-multiplayer');
                break;
        }

        mainMenu.innerHTML = html;
        this.attachListeners();
    }

    // Render Methods
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
                ← Back
            </button>
        `;
    }

    private renderMainMenu3d(): string 
    {
        return `
            <h1 class="text-5xl font-bold mb-6 text-white">🏓 3D Pong Game</h1>
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

    private renderColorSelection(forMultiplayer: boolean = false): string 
    {
        const colors: Array<{id: Paddlecolor, name: string, bg: string}> = [
            { id: 'neon', name: '✨ Neon', bg: 'bg-yellow-500' },
            { id: 'fire', name: '🔥 Fire', bg: 'bg-red-600' },
            { id: 'ice', name: '❄️ Ice', bg: 'bg-blue-400' },
            { id: 'rainbow', name: '🌈 Rainbow', bg: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' },
            { id: 'matrix', name: '💚 Matrix', bg: 'bg-green-500' },
            { id: 'gold', name: '✨ Gold', bg: 'bg-yellow-600' },
            { id: 'shadow', name: '🌑 Shadow', bg: 'bg-gray-800' },
            { id: 'default', name: '⚪ Default', bg: 'bg-white' }
        ];
        
        const title = forMultiplayer ? 'Select Paddle Colors' : 'Select Your Paddle Color';
        
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

    // Event listener attachment
    private attachListeners(): void 
    {
        switch (this.currentMenu) 
        {
            case 'mode-selection':
                this.attachModeSelectionListeners();
                break;
            case 'main-2d':
            case 'main-3d':
                this.attachMainMenuListeners();
                break;
            case 'difficulty':
                this.attachDifficultyListeners();
                break;
            case 'color-selection':
                this.attachColorSelectionListeners();
                break;
        }
    }

    private attachModeSelectionListeners(): void 
    {
        document.getElementById('mode2d')?.addEventListener('click', () => {
            this.is3DMode = false;
            this.currentMenu = 'main-2d';
            this.updateMenu();
        });

        document.getElementById('mode3d')?.addEventListener('click', () => {
            this.is3DMode = true;
            this.currentMenu = 'main-3d';
            this.updateMenu();
        });

        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.callbacks.onBackToGames();
        });
    }

    private attachMainMenuListeners(): void 
    {
        document.getElementById('playLocal')?.addEventListener('click', () => {
            this.selectedMode = 'local-multiplayer';
            this.currentMenu = 'color-selection';
            this.updateMenu();
        });
        
        document.getElementById('playAI')?.addEventListener('click', () => {
            this.selectedMode = 'ai';
            this.currentMenu = 'difficulty';
            this.updateMenu();
        });
        
        document.getElementById('playOnline')?.addEventListener('click', () => {
            alert('🚧 Online multiplayer coming soon!');
        });
        
        document.getElementById('tournament')?.addEventListener('click', () => {
            alert('🚧 Tournament mode coming soon!');
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.currentMenu = 'mode-selection';
            this.updateMenu();
        });
    }

    private attachDifficultyListeners(): void 
    {
        document.getElementById('easyBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'easy';
            this.currentMenu = 'color-selection';
            this.updateMenu();
        });
        
        document.getElementById('hardBtn')?.addEventListener('click', () => {
            this.selectedDifficulty = 'hard';
            this.currentMenu = 'color-selection';
            this.updateMenu();
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.currentMenu = this.is3DMode ? 'main-3d' : 'main-2d';
            this.updateMenu();
        });
    }

    private attachColorSelectionListeners(): void 
    {
        const forMultiplayer = this.selectedMode === 'local-multiplayer';
        
        const colorButtons = document.querySelectorAll('.paddle-color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const color = target.dataset.color as Paddlecolor;
                
                if (forMultiplayer) 
                    this.handleMultiplayerColorSelection(color);
                else 
                {
                    this.selectedPaddle1Color = color;
                    gameManager.setPaddleColor(1, color);
                    this.startGame();
                }
            });
        });
        
        if (forMultiplayer) 
        {
            document.getElementById('startGameBtn')?.addEventListener('click', () => {
                if (this.selectedPaddle1Color === 'default' || this.selectedPaddle2Color === 'default') 
                {
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
                this.currentMenu = 'difficulty';
            else 
                this.currentMenu = this.is3DMode ? 'main-3d' : 'main-2d';
            
            this.updateMenu();
        });
    }

    private handleMultiplayerColorSelection(color: Paddlecolor): void 
    {
        if (this.selectedPaddle1Color === 'default') 
        {
            this.selectedPaddle1Color = color;
            gameManager.setPaddleColor(1, color);
        } 
        else if (this.selectedPaddle2Color === 'default') 
        {
            this.selectedPaddle2Color = color;
            gameManager.setPaddleColor(2, color);
        } 
        else 
        {
            this.selectedPaddle1Color = this.selectedPaddle2Color;
            this.selectedPaddle2Color = color;
            gameManager.setPaddleColor(1, this.selectedPaddle1Color);
            gameManager.setPaddleColor(2, color);
        }
        this.updateColorDisplays();
    }

    private updateColorDisplays(): void 
    {
        const p1Display = document.getElementById('p1ColorDisplay');
        const p2Display = document.getElementById('p2ColorDisplay');
        
        if (p1Display)
            p1Display.textContent = this.selectedPaddle1Color.toUpperCase();
        if (p2Display)
            p2Display.textContent = this.selectedPaddle2Color.toUpperCase();
        
    }

    private startGame(): void 
    {
        if (this.is3DMode) 
            this.callbacks.onStart3DGame(this.selectedMode === 'ai' ? 'ai' : 'multiplayer');
        else 
            this.callbacks.onStart2DGame();
    }

    public showMenuAfterGame(): void 
    {
        const menu = document.getElementById('pongMenuContainer');
        if (menu) 
            menu.style.display = 'flex';
        this.resetSelections();
        this.currentMenu = this.is3DMode ? 'main-3d' : 'main-2d';
        this.updateMenu();
    }
}