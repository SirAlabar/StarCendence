import { BaseComponent } from '../components/BaseComponent';
import { gameManager } from '../game/managers/PongManager';
import { navigateTo, isAuthenticated } from '../router/router';

type GameMode = 'local-multiplayer' | 'online-multiplayer' | 'ai' | 'tournament' | null;
type ViewType = '2d' | '3d' | null;
type AiDifficulty = 'easy' | 'hard';

export default class PongPage extends BaseComponent 
{
    private resizeListener: (() => void) | null = null;
    private selectedDifficulty: AiDifficulty = 'easy'; 
    private gameEndHandler: ((event: Event) => void) | null = null;
    private gameGoalHandler: ((event: Event) => void) | null = null;
    private gamePaddleHitHandler: ((event: Event) => void) | null = null;
    private selectedMode: GameMode = null;
    private selectedView: ViewType = null;

    render(): string 
    {
        return `
            <div class="w-full h-screen flex flex-col bg-gray-950">
                <!-- Message Container -->
                <div id="pongMessage" class="w-full px-4 pt-4"></div>
                
                <!-- Game HUD (Score, Back Button, Controls) -->
                <div id="pongHUD" class="w-full px-4 py-4 bg-gray-900/80 border-b border-cyan-500/50 hidden">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        <!-- Score Display -->
                        <div class="flex-1 flex justify-around items-center">
                            <div class="text-center">
                                <p class="text-xs sm:text-sm text-gray-400 mb-1">PLAYER 1</p>
                                <p id="score1" class="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan-400 font-mono">0</p>
                            </div>
                            <div class="text-center">
                                <p class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-500">-</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs sm:text-sm text-gray-400 mb-1"><span id="player2Label">PLAYER 2</span></p>
                                <p id="score2" class="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-400 font-mono">0</p>
                            </div>
                        </div>
                        
                        <!-- Back Button -->
                        <button id="gameBackBtn" class="ml-4 sm:ml-8 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                            ← BACK
                        </button>
                    </div>
                </div>
                
                <!-- Controls Info -->
                <div id="controlsInfo" class="w-full px-4 py-2 bg-gray-900/60 border-b border-yellow-500/30 hidden">
                    <div class="max-w-7xl mx-auto text-center">
                        <p class="text-xs sm:text-sm text-yellow-300/80 font-mono">
                            <span class="text-yellow-400 font-bold">CONTROLS:</span> 
                            <span id="controlsText">Player 1  Move Up (W) Move Down (S) | Player 2 Move Up (↑) Move Down(↓) | Pause (ESC) Start Ball (SPACEBAR) </span>
                        </p>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <div class="relative w-full max-w-7xl">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                            style="display: none; aspect-ratio: 4/3;"
                        ></canvas>
                       
                        <div id="pongMenuContainer" class="w-full">
                            ${this.renderModeSelection()}
                        </div>
                        
                        <!-- Winner Overlay -->
                        <div id="winnerOverlay" class="absolute inset-0 flex items-center justify-center bg-black/80 z-40" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderModeSelection(): string 
    {
        return `
            <div class="w-full mx-auto px-2 sm:px-4 py-4">
                <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 text-cyan-300 glow-text-cyan text-center">CHOOSE YOUR MODE</h1>
                <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 md:mb-8 text-center">Pick How You Want to Play Pong</p>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                    <!-- LOCAL MULTIPLAYER -->
                    <div id="localCard" class="mode-card rounded-xl md:rounded-2xl p-6 md:p-10 border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/multiplayer.png" alt="Local" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-2 md:mb-4 opacity-80">
                            <h3 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400 mb-1 md:mb-2">LOCAL 2P</h3>
                            <p class="text-xs sm:text-sm md:text-base text-gray-400 mb-3 md:mb-6">Same keyboard</p>
                            <button class="select-mode-btn w-full py-2 md:py-3 px-4 md:px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                                SELECT
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full items-center justify-center hidden shadow-lg shadow-blue-500/50">
                            <svg class="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- ONLINE MULTIPLAYER -->
                    <div id="onlineCard" class="mode-card rounded-xl md:rounded-2xl p-6 md:p-10 border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/multiplayer.png" alt="Online" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-2 md:mb-4 opacity-80">
                            <h3 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-400 mb-1 md:mb-2">ONLINE</h3>
                            <p class="text-xs sm:text-sm md:text-base text-gray-400 mb-3 md:mb-6">With friends</p>
                            <button class="select-mode-btn w-full py-2 md:py-3 px-4 md:px-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                                SELECT
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-full items-center justify-center hidden shadow-lg shadow-purple-500/50">
                            <svg class="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- AI -->
                    <div id="aiCard" class="mode-card rounded-xl md:rounded-2xl p-6 md:p-10 border-2 border-green-500/40 bg-gradient-to-br from-green-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/ia_bot.png" alt="AI" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-2 md:mb-4 opacity-80">
                            <h3 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400 mb-1 md:mb-2">VS AI</h3>
                            <p class="text-xs sm:text-sm md:text-base text-gray-400 mb-3 md:mb-6">Battle CPU</p>
                            <button class="select-mode-btn w-full py-2 md:py-3 px-4 md:px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                                SELECT
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full items-center justify-center hidden shadow-lg shadow-green-500/50">
                            <svg class="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- TOURNAMENT -->
                    <div id="tournamentCard" class="mode-card rounded-xl md:rounded-2xl p-6 md:p-10 border-2 border-orange-500/40 bg-gradient-to-br from-orange-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/50 relative">
                        <div class="flex flex-col items-center">
                            <img src="/assets/images/tournament.png" alt="Tournament" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-2 md:mb-4 opacity-80">
                            <h3 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-orange-400 mb-1 md:mb-2">TOURNAMENT</h3>
                            <p class="text-xs sm:text-sm md:text-base text-gray-400 mb-3 md:mb-6">Win a cup</p>
                            <button class="select-mode-btn w-full py-2 md:py-3 px-4 md:px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                                JOIN
                            </button>
                        </div>
                        <div class="selected-indicator absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-full items-center justify-center hidden shadow-lg shadow-orange-500/50">
                            <svg class="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4 md:mb-6">
                    <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-cyan-300 mb-2 md:mb-3 text-center">GAME VIEW TYPE</h2>
                    <div class="flex justify-center gap-3 md:gap-4">
                        <button id="view2DBtn" class="view-toggle-btn relative py-2 md:py-3 px-8 md:px-12 rounded-lg border-2 border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold text-base sm:text-lg md:text-xl transition-all hover:bg-cyan-600 hover:text-white">
                            2D
                            <div class="view-selected-indicator absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-7 md:h-7 bg-cyan-500 rounded-full items-center justify-center hidden shadow-lg shadow-cyan-500/50">
                                <svg class="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </button>
                        <button id="view3DBtn" class="view-toggle-btn relative py-2 md:py-3 px-8 md:px-12 rounded-lg border-2 border-cyan-500/50 bg-cyan-900/30 text-cyan-300 font-bold text-base sm:text-lg md:text-xl transition-all hover:bg-cyan-600 hover:text-white">
                            3D
                            <div class="view-selected-indicator absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-7 md:h-7 bg-cyan-500 rounded-full items-center justify-center hidden shadow-lg shadow-cyan-500/50">
                                <svg class="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-3 md:gap-4 justify-center">
                    <button id="backBtn" class="py-3 md:py-4 px-8 md:px-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-base sm:text-lg md:text-xl transition-all shadow-lg">
                        CANCEL
                    </button>
                    <button id="continueBtn" class="py-3 md:py-4 px-10 md:px-16 rounded-lg bg-gray-600 text-gray-400 font-bold text-base sm:text-lg md:text-xl cursor-not-allowed opacity-50 transition-all" disabled>
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
            <div class="w-full max-w-4xl mx-auto px-4 py-4">
                <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 text-cyan-300 glow-text-cyan text-center">SELECT AI DIFFICULTY</h1>
                <p class="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 md:mb-8 text-center">Choose your challenge level</p>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                    <!-- Easy Card -->
                    <div id="easyCard" class="difficulty-card rounded-xl md:rounded-2xl p-8 md:p-12 border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/50">
                        <div class="flex flex-col items-center">
                            <div class="text-6xl mb-4 md:mb-6"><img src="/assets/images/ia_easy.png" alt="AI" class="w-20 h-20 md:w-24 md:h-24 mb-3 md:mb-4 opacity-80"></div>
                            <h3 class="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2 md:mb-3">EASY</h3>
                            <p class="text-sm sm:text-base text-gray-400 text-center mb-4 md:mb-6">Balanced gameplay</p>
                        </div>
                    </div>
                    
                    <!-- Hard Card -->
                    <div id="hardCard" class="difficulty-card rounded-xl md:rounded-2xl p-8 md:p-12 border-2 border-red-500/40 bg-gradient-to-br from-red-900/40 to-gray-900/60 backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/50">
                        <div class="flex flex-col items-center">
                            <div class="text-6xl mb-4 md:mb-6"><img src="/assets/images/ia_hard.png" alt="AI" class="w-20 h-20 md:w-24 md:h-24 mb-3 md:mb-4 opacity-80"></div>
                            <h3 class="text-2xl sm:text-3xl font-bold text-red-400 mb-2 md:mb-3">HARD</h3>
                            <p class="text-sm sm:text-base text-gray-400 text-center mb-4 md:mb-6">Accurate predictions, tough to beat</p>
                        </div>
                    </div>
                </div>
                
                <button id="backToModeSelect" class="w-full py-3 md:py-4 px-6 md:px-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-base sm:text-lg md:text-xl transition-all">
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
        
        // Set up event handlers
        this.gameEndHandler = this.handleGameEnd.bind(this);
        this.gameGoalHandler = this.handleGameGoal.bind(this);
        this.gamePaddleHitHandler = this.handlePaddleHit.bind(this);
        
        // Subscribe to game events
        gameManager.on('game:ended', this.gameEndHandler);
        gameManager.on('game:goal', this.gameGoalHandler);
        gameManager.on('game:paddle-hit', this.gamePaddleHitHandler);
        gameManager.on('game:score-update', this.handleScoreUpdate.bind(this));
        
        
    }

    private attachModeSelectionListeners(): void 
    {
        const localCard = document.getElementById('localCard');
        const onlineCard = document.getElementById('onlineCard');
        const aiCard = document.getElementById('aiCard');
        const tournamentCard = document.getElementById('tournamentCard');
        
        if (localCard) 
        {
            localCard.addEventListener('click', () => this.selectMode('local-multiplayer'));
        }
        if (onlineCard) 
        {
            onlineCard.addEventListener('click', () => this.selectMode('online-multiplayer'));
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
        
        const gameBackBtn = document.getElementById('gameBackBtn');
        if (gameBackBtn) 
        {
            gameBackBtn.addEventListener('click', () => this.handleGameBack());
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
            'local-multiplayer': 'localCard',
            'online-multiplayer': 'onlineCard',
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
        
        // Check authentication ONLY for online multiplayer and tournament
        if (this.selectedMode === 'online-multiplayer' || this.selectedMode === 'tournament') 
        {
            if (!isAuthenticated()) 
            {
                this.showMessage(
                    'You need to be logged in to play online!\nRedirecting to login...',
                    'error'
                );

                setTimeout(() => 
                {
                    const redirectPath = this.selectedMode === 'tournament' ? '/tournaments' : '/pong-lobby';
                    localStorage.setItem('redirectAfterLogin', redirectPath);
                    navigateTo('/login');
                }, 3000);

                return;
            }
        }
        
        // Handle different modes
        if (this.selectedMode === 'ai') 
        {
            this.showDifficultySelection();
        }
        else if (this.selectedMode === 'local-multiplayer') 
        {
            this.startGame();
        }
        else if (this.selectedMode === 'online-multiplayer') 
        {
            navigateTo('/pong-lobby');
        }
        else if (this.selectedMode === 'tournament') 
        {
            navigateTo('/tournaments');
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
                @keyframes pulse-slow 
                {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow 
                {
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

    private async startGame(): Promise<void> 
    {
        const menu = document.getElementById('pongMenuContainer');
        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        const hud = document.getElementById('pongHUD');
        const controlsInfo = document.getElementById('controlsInfo');
        const player2Label = document.getElementById('player2Label');
        
        if (!canvas) 
        {
            console.error('❌ Canvas not found');
            return;
        }
        
        if (menu) 
        {
            menu.style.display = 'none';
        }
        
        if (hud) 
        {
            hud.classList.remove('hidden');
        }
        
        if (controlsInfo) 
        {
            controlsInfo.classList.remove('hidden');
        }
        
        // Update player 2 label based on mode
        if (player2Label) 
        {
            player2Label.textContent = this.selectedMode === 'ai' ? 'AI' : 'PLAYER 2';
        }
        
        if (canvas) 
        {
            canvas.style.display = 'block';
            this.resizeCanvas(canvas);
            
            try 
            {
                // Build game config
                const config = 
                {
                    mode: this.selectedMode === 'ai' ? 'ai' as const : 'local-multiplayer' as const,
                    difficulty: this.selectedMode === 'ai' ? this.selectedDifficulty : undefined,
                    paddlecolor1: gameManager.getPaddleColor(1),
                    paddlecolor2: gameManager.getPaddleColor(2),
                    gamewidth: canvas.width,
                    gameheight: canvas.height
                };
                
                
                // Initialize game based on view type
                if (this.selectedView === '2d') 
                {
                    await gameManager.init2DGame(canvas, config);
                }
                else if (this.selectedView === '3d') 
                {
                    await gameManager.init3DGame(canvas, config);
                }
                
                gameManager.startGame();
                this.setupResizeListener(canvas);
                
                
            }
            catch (error) 
            {
                this.showMessage('Failed to start game. Please try again.', 'error');
                this.resetSelection();
            }
        }
    }

    private resizeCanvas(canvas: HTMLCanvasElement): void 
    {
        const container = canvas.parentElement;
        if (!container) 
        {
            return;
        }
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    private setupResizeListener(canvas: HTMLCanvasElement): void 
    {
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
            
            // Only handle resize for 2D games
            if (gameManager.getCurrentDimension() !== '2d') 
            {
                return;
            }
            
            const container = canvas.parentElement;
            if (!container) 
            {
                return;
            }
            gameManager.pauseGame();
            
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            gameManager.resumeGame();
        };
        
        window.addEventListener('resize', this.resizeListener);
    }

    private handleGameEnd(event: Event): void 
    {
        const customEvent = event as CustomEvent;
        const winner = customEvent.detail.winner;
        
        let winnerName: string;
        if (winner === 'player1') 
        {
            winnerName = 'Player 1';
        }
        else 
        {
            winnerName = this.selectedMode === 'ai' ? 'AI' : 'Player 2';
        }
        
        this.showWinnerOverlay(winnerName);
    }

    private handleGameGoal(_event: Event): void 
    {
        console.log('⚽ GOAL!');
        // TODO: Add goal sound effect
    }

    private handlePaddleHit(_event: Event): void 
    {
        console.log('🏓 Paddle hit!');
        // TODO: Add paddle hit sound effect
    }

    private handleScoreUpdate(event: Event): void 
    {
        const customEvent = event as CustomEvent;
        const { player1Score, player2Score } = customEvent.detail;
        
        const score1El = document.getElementById('score1');
        const score2El = document.getElementById('score2');
        
        if (score1El) 
        {
            score1El.textContent = String(player1Score);
        }
        
        if (score2El) 
        {
            score2El.textContent = String(player2Score);
        }
    }

    private handleGameBack(): void 
    {
        const result = confirm('Are you sure you want to leave the game?');
        if (result) 
        {
            this.goBack();
        }
    }

    private showWinnerOverlay(winner: string): void 
    {
        const overlay = document.getElementById('winnerOverlay');
        if (!overlay) 
        {
            return;
        }
        
        overlay.innerHTML = `
            <div class="flex flex-col items-center justify-center gap-8 p-8 text-center">
                <div class="animate-pulse">
                    <h2 class="text-6xl font-bold text-white mb-4">🏆</h2>
                    <h3 class="text-4xl font-bold text-cyan-400 mb-2">${this.escapeHtml(winner)} Wins!</h3>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 mt-8">
                    <button id="playAgainBtn" class="px-8 py-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg transition-all shadow-lg shadow-green-500/50">
                        🔄 PLAY AGAIN
                    </button>
                    <button id="goBackBtn" class="px-8 py-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-lg transition-all shadow-lg shadow-red-500/50">
                        🚪 GO BACK
                    </button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
        
        // Attach event listeners
        const playAgainBtn = overlay.querySelector('#playAgainBtn');
        const goBackBtn = overlay.querySelector('#goBackBtn');
        
        if (playAgainBtn) 
        {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        
        if (goBackBtn) 
        {
            goBackBtn.addEventListener('click', () => this.goBack());
        }
    }

    private hideWinnerOverlay(): void 
    {
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) 
        {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
    }

    private playAgain(): void 
    {
        this.hideWinnerOverlay();
        // Reset scores
        const score1El = document.getElementById('score1');
        const score2El = document.getElementById('score2');
        if (score1El) score1El.textContent = '0';
        if (score2El) score2El.textContent = '0';
        
        // Restart game with same settings
        this.startGame();
    }

    private resetSelection(): void 
    {
        this.selectedMode = null;
        this.selectedView = null;
        
        const menuContainer = document.getElementById('pongMenuContainer');
        if (menuContainer) 
        {
            menuContainer.innerHTML = this.renderModeSelection();
            menuContainer.style.display = 'block';
            this.attachModeSelectionListeners();
        }
        
        const canvas = document.getElementById('pongCanvas');
        if (canvas) 
        {
            canvas.style.display = 'none';
        }
        
        const hud = document.getElementById('pongHUD');
        if (hud) 
        {
            hud.classList.add('hidden');
        }
        
        const controlsInfo = document.getElementById('controlsInfo');
        if (controlsInfo) 
        {
            controlsInfo.classList.add('hidden');
        }
    }

    private goBack(): void 
    {
        this.dispose();
        this.resetSelection();
    }

    public dispose(): void 
    {
        
        // Cleanup game manager
        gameManager.cleanup();
        
        // Remove event listeners
        if (this.gameEndHandler) 
        {
            gameManager.off('game:ended', this.gameEndHandler);
            this.gameEndHandler = null;
        }
        
        if (this.gameGoalHandler) 
        {
            gameManager.off('game:goal', this.gameGoalHandler);
            this.gameGoalHandler = null;
        }
        
        if (this.gamePaddleHitHandler) 
        {
            gameManager.off('game:paddle-hit', this.gamePaddleHitHandler);
            this.gamePaddleHitHandler = null;
        }
        
        // Remove resize listener
        if (this.resizeListener) 
        {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }
}