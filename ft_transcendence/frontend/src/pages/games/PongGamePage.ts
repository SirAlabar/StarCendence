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
                <!-- Game HUD (Score, Back Button) -->
                <div id="pongHUD" class="w-full px-4 py-4 bg-gray-900/80 border-b border-cyan-500/50">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        <!-- Score Display -->
                        <div class="flex-1 flex justify-around items-center">
                            <div class="text-center">
                                <p class="text-xs sm:text-sm text-gray-400 mb-1">PLAYER 1</p>
                                <p id="score-p1" class="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan-400 font-mono">0</p>
                            </div>
                            <div class="text-center">
                                <p class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-500">-</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs sm:text-sm text-gray-400 mb-1">PLAYER 2</p>
                                <p id="score-p2" class="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-400 font-mono">0</p>
                            </div>
                        </div>
                        
                        <!-- Back Button -->
                        <button id="gameBackBtn" class="ml-4 sm:ml-8 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm md:text-base transition-all">
                            ← BACK
                        </button>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <div class="relative w-full max-w-7xl">
                        <div id="canvas-wrapper" class="w-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50" 
                             style="aspect-ratio: 16/9; position: relative;">
                            <canvas id="pongCanvas" style="display: block; width: 100%; height: 100%; background-color: #0f0f1e;"></canvas>
                        </div>
                        
                        <div class="mt-3 text-center text-gray-400 text-xs sm:text-sm">
                            Controls: ${this.side === 'left' ? 'W / S' : 'W / S'} 
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async mount(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        this.gameId = params.get('gameId');
        this.side = (params.get('side') as 'left' | 'right') || 'left';
        const userobj = LoginService.getCurrentUser();
        const userId = userobj?.sub || userobj?.id;
        const p1Color = params.get('p1Color') || 'default';
        const p2Color = params.get('p2Color') || 'default';


        if (!this.gameId || !userId) 
        {
            console.error('[PongGamePage] ❌ Missing game parameters');
            await Modal.alert('Error', 'Missing game parameters (gameId required)');
            navigateTo('/pong');
            return;
        }

        // Ensure WebSocket is connected
        if (!webSocketService.isConnected()) {
            console.warn('[PongGamePage] ⚠️ WebSocket not connected, attempting to connect...');
            try {
                await webSocketService.connect();

            } 
            catch (error) 
            {
                console.error('[PongGamePage] ❌ Failed to connect WebSocket:', error);
                await Modal.alert('Connection Error', 'Failed to connect to game server. Please try again.');
                navigateTo('/pong');
                return;
            }
        } 
        else 
        {
            console.log('[PongGamePage] WebSocket already connected');
        }

        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        const wrapper = document.getElementById('canvas-wrapper') as HTMLDivElement;
        
        if (!canvas || !wrapper) 
        {
            console.error('[PongGamePage] ❌ Canvas or wrapper not found in DOM');
            await Modal.alert('Error', 'Game canvas not found');
            navigateTo('/pong');
            return;
        }

        this.fitCanvasToWrapper(canvas, wrapper);

        const gameConfig: GameConfig = {
        mode: 'online-multiplayer',
        difficulty: 'easy',
        paddlecolor1: p1Color as any, 
        paddlecolor2: p2Color as any,
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
            gameManager.resizeGame(canvas.width, canvas.height);
            gameManager.startGame();
            
            // Initialize scores to 0
            const scoreP1 = document.getElementById('score-p1');
            const scoreP2 = document.getElementById('score-p2');
            if (scoreP1) scoreP1.innerText = '0';
            if (scoreP2) scoreP2.innerText = '0';

            
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
       
        const newWidth = wrapper.clientWidth;
        const newHeight = wrapper.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
            canvas.width = newWidth;
            canvas.height = newHeight;
        } else {

            canvas.width = 800;
            canvas.height = 600;
        }
    }

    private setupUIListeners() {

        // Add back button listener
        const gameBackBtn = document.getElementById('gameBackBtn');
        if (gameBackBtn) {
            gameBackBtn.addEventListener('click', async () => {
                const result = await Modal.confirm(
                    'Exit Game',
                    'Are you sure you want to exit the game?',
                    'EXIT',
                    'CANCEL',
                    true
                );
                if (result) {
                    navigateTo('/pong');
                }
            });
        }
        
        gameManager.on('game:score-update', (e: any) => {
            const scoreP1 = document.getElementById('score-p1');
            const scoreP2 = document.getElementById('score-p2');
            if (scoreP1) {
                scoreP1.innerText = e.detail.player1Score?.toString() || '0';
            }
            if (scoreP2) {
                scoreP2.innerText = e.detail.player2Score?.toString() || '0';
            }
        });

        gameManager.on('game:ended', (e: any) => {
            const winner = e.detail.winner;
            Modal.alert('Game Over', `${winner} Wins!`).then(() => {
                navigateTo('/pong');
            });
        });
    }

    dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        gameManager.cleanup();
    }

    
}