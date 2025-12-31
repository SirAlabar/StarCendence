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
            <div class="game-page-container d-flex flex-column align-items-center justify-content-center vh-100 bg-dark w-100">
                
                <div class="game-header mb-3 text-white d-flex justify-content-between" style="width: 95%; max-width: 1400px;">
                    <div class="player-1">
                        <span class="badge bg-primary fs-5" id="score-p1">0</span>
                        <span id="name-p1" class="ms-2">Player 1</span>
                    </div>
                    <div class="game-timer" id="game-timer">00:00</div>
                    <div class="player-2">
                        <span id="name-p2" class="me-2">Player 2</span>
                        <span class="badge bg-danger fs-5" id="score-p2">0</span>
                    </div>
                </div>

                <div id="canvas-wrapper" class="shadow-lg border border-secondary rounded" 
                     style="width: 95%; max-width: 1400px; aspect-ratio: 16/9; position: relative; background-color: #1a1a2e; margin: 0 auto;">
                    <canvas id="pongCanvas" style="display: block; width: 100%; height: 100%; background-color: #0f0f1e;"></canvas>
                </div>

                <div class="mt-3 text-muted">
                    <small>Controls: ${this.side === 'left' ? 'W / S' : 'Arrow Up / Arrow Down'} | Press ESC to Pause</small>
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