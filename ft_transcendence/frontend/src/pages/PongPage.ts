import { BaseComponent } from '../components/BaseComponent';
import { AiDifficulty } from '@/game/engines/pong2D/entities/EnemyAi';
import { gameManager } from '@/game/managers/PongManager';
import { Pong3Dscene } from '@/game/engines/pong3D/Engine';
import { navigateTo, isAuthenticated } from '../router/router';

type GameMode = 'multiplayer' | 'ai' | 'tournament' | null;
type ViewType = '2d' | '3d' | null;

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
    private selectedDifficulty: AiDifficulty = 'easy'; 
    private gameEndHandler: ((event: Event) => void) | null = null;
    private pong3D: Pong3Dscene | null = null;
    private selectedMode: GameMode = null;
    private selectedView: ViewType = null;

    render(): string 
    {
        return `
            <div class="container mx-auto px-6 -mt-20 pt-20">
                <!-- Message Container -->
                <div id="pongMessage" class="mb-4"></div>
                
                <div class="flex items-center justify-center">
                    <div class="relative w-full max-w-7xl" style="aspect-ratio: 4/3; max-height: 80vh;">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                            style="display: none;"
                        ></canvas>
                       
                        <div id="pongMenuContainer" class="absolute inset-0 flex flex-col items-center justify-center text-center z-50">
                            ${this.renderModeSelection()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderModeSelection(): string 
    {
        return `
            <div class="w-full max-w-6xl mx-auto px-4">
                <h1 class="text-6xl font-bold mb-4 text-cyan-300 glow-text-cyan">CHOOSE YOUR MODE</h1>
                <p class="text-xl text-gray-300 mb-12">Pick How You Want to Play Pong</p>
                
                <div class="grid grid-cols-3 gap-6 mb-12">
                    <div id="multiplayerCard" class="mode-card rounded-2xl p-8 border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/eny1.png" alt="Multiplayer" class="w-24 h-24 mb-4 opacity-80">
                            <h3 class="text-2xl font-bold text-purple-400 mb-2">MULTIPLAYER</h3>
                            <p class="text-gray-400 text-sm mb-6">Play with friends</p>
                            <button class="select-mode-btn w-full py-3 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all">
                                SELECT
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-4 right-4 w-10 h-10 bg-purple-500 rounded-full items-center justify-center hidden shadow-lg shadow-purple-500/50">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <div id="aiCard" class="mode-card rounded-2xl p-8 border-2 border-green-500/40 bg-gradient-to-br from-green-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/eny2.png" alt="AI" class="w-24 h-24 mb-4 opacity-80">
                            <h3 class="text-2xl font-bold text-green-400 mb-2">PLAY VS AI</h3>
                            <p class="text-gray-400 text-sm mb-6">Battle the CPU</p>
                            <button class="select-mode-btn w-full py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all">
                                SELECT
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-4 right-4 w-10 h-10 bg-green-500 rounded-full items-center justify-center hidden shadow-lg shadow-green-500/50">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <div id="tournamentCard" class="mode-card rounded-2xl p-8 border-2 border-orange-500/40 bg-gradient-to-br from-orange-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/eny3.png" alt="Tournament" class="w-24 h-24 mb-4 opacity-80">
                            <h3 class="text-2xl font-bold text-orange-400 mb-2">TOURNAMENT</h3>
                            <p class="text-gray-400 text-sm mb-6">Win a cup</p>
                            <button class="select-mode-btn w-full py-3 px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all">
                                JOIN
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-4 right-4 w-10 h-10 bg-orange-500 rounded-full items-center justify-center hidden shadow-lg shadow-orange-500/50">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-cyan-300 mb-4">GAME VIEW TYPE</h2>
                    <div class="flex justify-center gap-4">
                        <button id="view2DBtn" class="view-toggle-btn relative py-3 px-12 rounded-lg border-2 border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold text-xl transition-all hover:bg-cyan-600 hover:text-white">
                            2D
                            <div class="view-selected-indicator absolute -top-2 -right-2 w-7 h-7 bg-cyan-500 rounded-full items-center justify-center hidden shadow-lg shadow-cyan-500/50">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </button>
                        <button id="view3DBtn" class="view-toggle-btn relative py-3 px-12 rounded-lg border-2 border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold text-xl transition-all hover:bg-cyan-600 hover:text-white">
                            3D
                            <div class="view-selected-indicator absolute -top-2 -right-2 w-7 h-7 bg-cyan-500 rounded-full items-center justify-center hidden shadow-lg shadow-cyan-500/50">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-4 justify-center">
                    <button id="backBtn" class="py-4 px-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl transition-all shadow-lg">
                        CANCEL
                    </button>
                    <button id="continueBtn" class="py-4 px-16 rounded-lg bg-gray-600 text-gray-400 font-bold text-xl cursor-not-allowed opacity-50 transition-all" disabled>
                        CONTINUE
                    </button>
                </div>
                
                <style>
                    .glow-text-cyan 
                    {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                    
                    .mode-card.selected 
                    {
                        border-width: 3px;
                        transform: scale(1.05);
                        box-shadow: 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                    
                    .mode-card.selected .selected-indicator 
                    {
                        display: flex;
                        animation: checkmarkPop 0.3s ease-out;
                    }
                    
                    .view-toggle-btn.selected 
                    {
                        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                        color: white;
                        border-color: #0ea5e9;
                        box-shadow: 0 0 30px rgba(14, 165, 233, 0.6);
                    }
                    
                    .view-toggle-btn.selected .view-selected-indicator 
                    {
                        display: flex;
                        animation: checkmarkPop 0.3s ease-out;
                    }
                    
                    @keyframes checkmarkPop 
                    {
                        0% { transform: scale(0); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                </style>
            </div>
        `;
    }

    private renderDifficultySelection(): string 
    {
        return `
            <div class="w-full max-w-4xl mx-auto px-4">
                <h1 class="text-6xl font-bold mb-4 text-cyan-300 glow-text-cyan">SELECT AI DIFFICULTY</h1>
                <p class="text-xl text-gray-300 mb-12">Choose your challenge level</p>
                
                <div class="grid grid-cols-2 gap-8 mb-12">
                    <!-- Easy Card -->
                    <div id="easyCard" class="difficulty-card rounded-2xl p-12 border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/50">
                        <div class="flex flex-col items-center">
                            <div class="text-6xl mb-6">😊</div>
                            <h3 class="text-3xl font-bold text-yellow-400 mb-3">EASY</h3>
                            <p class="text-gray-400 text-center mb-8">Balanced gameplay</p>
                        </div>
                    </div>
                    
                    <!-- Hard Card -->
                    <div id="hardCard" class="difficulty-card rounded-2xl p-12 border-2 border-red-500/40 bg-gradient-to-br from-red-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/50">
                        <div class="flex flex-col items-center">
                            <div class="text-6xl mb-6">😈</div>
                            <h3 class="text-3xl font-bold text-red-400 mb-3">HARD</h3>
                            <p class="text-gray-400 text-center mb-8">Accurate predictions, tough to beat</p>
                        </div>
                    </div>
                </div>
                
                <button id="backToModeSelect" class="w-full py-4 px-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl transition-all">
                    ← BACK
                </button>
                
                <style>
                    .glow-text-cyan 
                    {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                    
                    .difficulty-card:hover 
                    {
                        transform: scale(1.05);
                    }
                </style>
            </div>
        `;
    }

    mount(): void 
    {
        this.attachModeSelectionListeners();
        this.gameEndHandler = this.handleGameEnd.bind(this);
        window.addEventListener('gameManager:showMenu', this.gameEndHandler);
    }

    private attachModeSelectionListeners(): void 
    {
        const multiplayerCard = document.getElementById('multiplayerCard');
        const aiCard = document.getElementById('aiCard');
        const tournamentCard = document.getElementById('tournamentCard');
        
        if (multiplayerCard) 
        {
            multiplayerCard.addEventListener('click', () => this.selectMode('multiplayer'));
        }
        if (aiCard) 
        {
            aiCard.addEventListener('click', () => this.selectMode('ai'));
        }
        if (tournamentCard) 
        {
            tournamentCard.addEventListener('click', () => this.selectMode('tournament'));
        }
        
        const view2DBtn = document.getElementById('view2DBtn');
        const view3DBtn = document.getElementById('view3DBtn');
        
        if (view2DBtn) 
        {
            view2DBtn.addEventListener('click', () => this.selectView('2d'));
        }
        if (view3DBtn) 
        {
            view3DBtn.addEventListener('click', () => this.selectView('3d'));
        }
        
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) 
        {
            continueBtn.addEventListener('click', () => this.handleContinue());
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) 
        {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }

    private attachDifficultyListeners(): void 
    {
        const easyCard = document.getElementById('easyCard');
        const hardCard = document.getElementById('hardCard');
        const backBtn = document.getElementById('backToModeSelect');
        
        if (easyCard) 
        {
            easyCard.addEventListener('click', () => 
            {
                this.selectedDifficulty = 'easy';
                this.startGame();
            });
        }
        
        if (hardCard) 
        {
            hardCard.addEventListener('click', () => 
            {
                this.selectedDifficulty = 'hard';
                this.startGame();
            });
        }
        
        if (backBtn) 
        {
            backBtn.addEventListener('click', () => this.resetSelection());
        }
    }

    private selectMode(mode: GameMode): void 
    {
        this.selectedMode = mode;
        
        document.querySelectorAll('.mode-card').forEach(card => 
        {
            card.classList.remove('selected');
        });
        
        const cardMap = 
        {
            'multiplayer': 'multiplayerCard',
            'ai': 'aiCard',
            'tournament': 'tournamentCard'
        };
        
        if (mode && cardMap[mode]) 
        {
            const card = document.getElementById(cardMap[mode]);
            if (card) 
            {
                card.classList.add('selected');
            }
        }
        
        this.updateContinueButton();
    }

    private selectView(view: ViewType): void 
    {
        this.selectedView = view;
        
        document.querySelectorAll('.view-toggle-btn').forEach(btn => 
        {
            btn.classList.remove('selected');
        });
        
        const btnId = view === '2d' ? 'view2DBtn' : 'view3DBtn';
        const btn = document.getElementById(btnId);
        if (btn) 
        {
            btn.classList.add('selected');
        }
        
        this.updateContinueButton();
    }

    private updateContinueButton(): void 
    {
        const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
        if (!continueBtn) 
        {
            return;
        }
        
        if (this.selectedMode && this.selectedView) 
        {
            continueBtn.disabled = false;
            continueBtn.classList.remove('bg-gray-600', 'text-gray-400', 'cursor-not-allowed', 'opacity-50');
            continueBtn.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'hover:from-purple-500', 'hover:to-pink-500', 'text-white', 'cursor-pointer', 'opacity-100');
            continueBtn.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.6)';
        }
        else 
        {
            continueBtn.disabled = true;
            continueBtn.classList.add('bg-gray-600', 'text-gray-400', 'cursor-not-allowed', 'opacity-50');
            continueBtn.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'hover:from-purple-500', 'hover:to-pink-500', 'text-white', 'cursor-pointer', 'opacity-100');
            continueBtn.style.boxShadow = '';
        }
    }

    private handleContinue(): void 
    {
        if (!this.selectedMode || !this.selectedView) 
        {
            return;
        }
        
        // Check authentication for multiplayer and tournament
        if (this.selectedMode === 'multiplayer' || this.selectedMode === 'tournament') 
        {

            if (!isAuthenticated()) 
            {
                this.showMessage('You need to be logged in to play multiplayer mode!', 'error');
                return;
            }
        }
        
        if (this.selectedMode === 'ai') 
        {
            this.showDifficultySelection();
        }
        else if (this.selectedMode === 'multiplayer') 
        {
            navigateTo('/pong-lobby');
        }
        else if (this.selectedMode === 'tournament') 
        {
            navigateTo('/pong-lobby');
        }
    }

    private showMessage(message: string, type: 'success' | 'error'): void 
    {
        const container = document.getElementById('pongMessage');
        if (!container) 
        {
            return;
        }

        const bgColor = type === 'success' ? 'bg-green-900/80' : 'bg-red-900/80';
        const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
        const textColor = type === 'success' ? 'text-green-300' : 'text-red-300';
        const icon = type === 'success' ? '✓' : '⚠';

        container.innerHTML = `
            <div class="max-w-4xl mx-auto ${bgColor} ${borderColor} border-2 rounded-xl p-4 backdrop-blur-sm shadow-2xl animate-pulse-slow">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${icon}</div>
                    <p class="${textColor} font-bold text-lg">
                        ${this.escapeHtml(message)}
                    </p>
                </div>
            </div>
            <style>
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s ease-in-out infinite;
                }
            </style>
        `;

        setTimeout(() => 
        {
            if (container) 
            {
                container.innerHTML = '';
            }
        }, 4000);
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private showDifficultySelection(): void 
    {
        const menuContainer = document.getElementById('pongMenuContainer');
        if (!menuContainer) 
        {
            return;
        }
        
        menuContainer.innerHTML = this.renderDifficultySelection();
        this.attachDifficultyListeners();
    }

    private startGame(): void 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (menu) 
        {
            menu.style.display = 'none';
        }
        
        if (canvas) 
        {
            canvas.style.display = 'block';
            this.resize(canvas);
            
            if (this.selectedView === '2d') 
            {
                this.start2DPong();
            }
            else if (this.selectedView === '3d') 
            {
                this.start3DPong();
            }
        }
    }

    private start2DPong(): void 
    {
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            return;
        }
        
        const config = this.selectedMode === 'ai' 
            ? { mode: 'ai' as const, difficulty: this.selectedDifficulty }
            : { mode: 'multiplayer' as const };
            
        gameManager.initGame(canvas, config);
        gameManager.startGame();
        
        if (this.resizeListener) 
        {
            window.removeEventListener('resize', this.resizeListener);
        }
        
        this.resizeListener = () => 
        {
            if (!canvas) 
            {
                return;
            }
            gameManager.pauseGame();
            const container = canvas.parentElement;
            if (!container) 
            {
                return;
            }
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            gameManager.resizeGame(newWidth, newHeight);
            gameManager.redraw();
        };
        
        window.addEventListener('resize', this.resizeListener);
    }

    private start3DPong(): void 
    {
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        
        if (!canvas) 
        {
            return;
        }
        
        gameManager.cleanup();
        this.pong3D = new Pong3Dscene(canvas);
    }

    private resize(canvas: HTMLCanvasElement): void 
    {
        const container = canvas.parentElement;
        if (!container) 
        {
            return;
        }
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    }

    private handleGameEnd(event: Event): void 
    {
        const customEvent = event as CustomEvent;
        const winner = customEvent.detail.winner;
        
        console.log(`${winner} won the game!`);
        
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas');
        
        if (menu) 
        {
            menu.style.display = 'flex';
        }
        
        if (canvas) 
        {
            canvas.style.display = 'none';
        }
        
        this.resetSelection();
    }

    private resetSelection(): void 
    {
        this.selectedMode = null;
        this.selectedView = null;
        
        const menuContainer = document.getElementById('pongMenuContainer');
        if (menuContainer) 
        {
            menuContainer.innerHTML = this.renderModeSelection();
            this.attachModeSelectionListeners();
        }
    }

    private goBack(): void 
    {
        this.dispose();
        navigateTo('/games');
    }

    public dispose(): void 
    {
        gameManager.cleanup();
        
        if (this.pong3D) 
        {
            this.pong3D.dispose();
            this.pong3D = null;
        }
        
        if (this.gameEndHandler) 
        {
            window.removeEventListener('gameManager:showMenu', this.gameEndHandler);
            this.gameEndHandler = null;
        }
        
        if (this.resizeListener) 
        {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }
}