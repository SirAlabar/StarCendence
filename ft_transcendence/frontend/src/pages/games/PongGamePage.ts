import { BaseComponent } from '../../components/BaseComponent';
import { navigateTo } from '../../router/router';
import { gameManager } from '../../game/managers/PongManager';
import { LoginService } from '../../services/auth/LoginService';
import { Modal } from '../../components/common/Modal';
import { GameConfig } from '@/game/utils/GameTypes';
import { webSocketService } from '../../services/websocket/WebSocketService';


export default class PongGamePage extends BaseComponent {
    private gameId: string | null = null;
    private side: 'left' | 'right' = 'left';
    private resizeObserver: ResizeObserver | null = null;


    constructor() {
        super();
    }

    render(): string {
        return `
            <div class="w-full h-screen flex flex-col bg-gray-950">
                <div id="pongMessage" class="w-full px-4 pt-4"></div>
                
                <div id="pongHUD" class="w-full px-4 py-4 bg-gray-900/80 border-b border-cyan-500/50">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        <div class="flex-1 flex justify-around items-center">
                            <div class="text-center">
                                <p class="text-xs sm:text-sm text-gray-400 mb-1"><span id="player1Label">PLAYER 1</span></p>
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
                        
                        <button id="gameBackBtn" class="ml-4 sm:ml-8 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                            LEAVE MATCH
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <div id="canvas-wrapper" class="relative w-full max-w-7xl h-full flex items-center justify-center">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full max-h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                            style="display: block; aspect-ratio: 16/9;"
                        ></canvas>
                        
                        <div id="winnerOverlay" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40 rounded-2xl" style="display: none;">
                        </div>
                    </div>
                </div>

                <div class="absolute bottom-4 left-0 w-full text-center text-gray-500 text-xs sm:text-sm pointer-events-none">
                     Controls: ${this.side === 'left' ? 'W / S' : 'Arrow Up / Arrow Down'}
                </div>
            </div>
        `;
    }

    async mount(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        this.gameId = params.get('gameId');
        this.side = (params.get('side') as 'left' | 'right') || 'left';
        const userobj = LoginService.getCurrentUser();
        console.log(userobj);
        const userId = userobj?.username || userobj?.name;
    

        if (!this.gameId || !userId) {
            console.error('[PongGamePage]  Missing game parameters');
            await Modal.alert('Error', 'Missing game parameters (gameId required)');
            navigateTo('/pong');
            return;
        }

        // Ensure WebSocket is connected
        if (!webSocketService.isConnected()) {
            console.warn('[PongGamePage] WebSocket not connected, attempting to connect...');
            try {
                await webSocketService.connect();
            } catch (error) {
                console.error('[PongGamePage] Failed to connect WebSocket:', error);
                await Modal.alert('Connection Error', 'Failed to connect to game server. Please try again.');
                navigateTo('/pong');
                return;
            }
        } 

        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        const wrapper = document.getElementById('canvas-wrapper') as HTMLDivElement;
        const leaveBtn = document.getElementById('gameBackBtn');
        
        if (!canvas || !wrapper) {
            console.error('[PongGamePage] Canvas or wrapper not found in DOM');
            await Modal.alert('Error', 'Game canvas not found');
            navigateTo('/pong');
            return;
        }

        // Attach Leave Listener
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.handleLeaveMatch());
        }

        // Initial Fit
        this.fitCanvasToWrapper(canvas, wrapper);

        const gameConfig: GameConfig = {
            mode: 'online-multiplayer',
            difficulty: 'easy',
            paddlecolor1: undefined,
            paddlecolor2: undefined,
            gamewidth: canvas.width, 
            gameheight: canvas.height
        };

        try {
            await gameManager.init2DGame(canvas, gameConfig, {
                matchId: this.gameId,
                side: this.side,
                userId: userId
            });

            this.setupUIListeners();
            gameManager.startGame();
            
            // Initialize scores
            const score1 = document.getElementById('score1');
            const score2 = document.getElementById('score2');
            if (score1) score1.innerText = '0';
            if (score2) score2.innerText = '0';

            // Responsive resizing
            this.resizeObserver = new ResizeObserver(() => {
                const oldWidth = canvas.width;
                const oldHeight = canvas.height;
                
                this.fitCanvasToWrapper(canvas, wrapper);
                
                if (oldWidth !== canvas.width || oldHeight !== canvas.height) {
                    gameManager.resizeGame(canvas.width, canvas.height);
                }
            });
            this.resizeObserver.observe(wrapper);

        } catch (error) {
            console.error('Failed to start game:', error);
            await Modal.alert('Error', 'Failed to initialize game engine');
            navigateTo('/pong');
        }
    }

    private fitCanvasToWrapper(canvas: HTMLCanvasElement, wrapper: HTMLElement) 
    {
    
        const availWidth = wrapper.clientWidth;
        const availHeight = wrapper.clientHeight;
    
        const targetRatio = 16 / 9;
        
        let newWidth = availWidth;
        let newHeight = availWidth / targetRatio;
        
        if (newHeight > availHeight) {
            newHeight = availHeight;
            newWidth = newHeight * targetRatio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
    }

    private setupUIListeners() {
        gameManager.on('game:score-update', (e: any) => {
            const score1 = document.getElementById('score1');
            const score2 = document.getElementById('score2');
            
            // Add a little pop animation when score updates
            if (score1) {
                const oldVal = score1.innerText;
                const newVal = e.detail.player1Score?.toString() || '0';
                if (oldVal !== newVal) {
                    score1.innerText = newVal;
                    this.animateScore(score1);
                }
            }
            if (score2) {
                const oldVal = score2.innerText;
                const newVal = e.detail.player2Score?.toString() || '0';
                if (oldVal !== newVal) {
                    score2.innerText = newVal;
                    this.animateScore(score2);
                }
            }
        });

        gameManager.on('game:ended', (e: any) => {
            const winner = e.detail.winner;
            this.showWinnerOverlay(winner);
        });
    }

    private animateScore(element: HTMLElement) {
        element.classList.remove('scale-150', 'text-white');
        void element.offsetWidth; 
        element.classList.add('transition-transform', 'duration-200', 'scale-150', 'text-white');
        setTimeout(() => {
            element.classList.remove('scale-150', 'text-white');
        }, 200);
    }

    private async handleLeaveMatch(): Promise<void> {
        const result = await Modal.confirm(
            'Leave Match',
            'Are you sure? You will forfeit the game.',
            'LEAVE',
            'CANCEL',
            true 
        );
        if (result) {
        
            this.dispose();
            navigateTo('/pong');
        }
    }

    private showWinnerOverlay(winner: string): void {
        const overlay = document.getElementById('winnerOverlay');
        if (!overlay) 
            return;
        
        overlay.innerHTML = `
            <div class="flex flex-col items-center justify-center gap-8 p-8 text-center animate-fade-in">
                <div class="animate-pulse">
                    <h2 class="text-6xl font-bold text-white mb-4">🏆</h2>
                    <h3 class="text-4xl font-bold text-cyan-400 mb-2">${this.escapeHtml(winner)} Wins!</h3>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 mt-8">
                    <button id="goBackBtn" class="px-8 py-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-lg transition-all shadow-lg shadow-red-500/50">
                         EXIT LOBBY
                    </button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
        
        const goBackBtn = overlay.querySelector('#goBackBtn');
        if (goBackBtn) {
            goBackBtn.addEventListener('click', () => {
                this.dispose();
                navigateTo('/pong');
            });
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        
        const leaveBtn = document.getElementById('gameBackBtn');
        if (leaveBtn) {
            const newBtn = leaveBtn.cloneNode(true);
            leaveBtn.parentNode?.replaceChild(newBtn, leaveBtn);
        }

        gameManager.cleanup();
    }
}