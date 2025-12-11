import { BaseComponent } from '../../components/BaseComponent';
import { navigateTo } from '../../router/router';
import { gameManager } from '../../game/managers/PongManager';
import { LoginService } from '../../services/auth/LoginService';
import { Modal } from '../../components/common/Modal';
import { GameConfig } from '@/game/utils/GameTypes';

export default class PongGamePage extends BaseComponent {
    private lobbyId: string | null = null;
    private side: 'left' | 'right' = 'left';
    private resizeObserver: ResizeObserver | null = null;

    constructor() {
        super();
    }

    render(): string {
        return `
            <div class="game-page-container d-flex flex-column align-items-center justify-content-center vh-100 bg-dark w-100">
                
                <div class="game-header mb-3 text-white d-flex justify-content-between w-75" style="max-width: 1000px;">
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
                     style="width: 90%; height: 70vh; max-width: 1200px; position: relative; background-color: #000;">
                    <canvas id="pongCanvas" style="display: block; width: 100%; height: 100%;"></canvas>
                </div>

                <div class="mt-3 text-muted">
                    <small>Controls: ${this.side === 'left' ? 'W / S' : 'Arrow Up / Arrow Down'} | Press ESC to Pause</small>
                </div>
            </div>
        `;
    }

    async mount(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        this.lobbyId = params.get('lobby');
        this.side = (params.get('side') as 'left' | 'right') || 'left';
        const userobj = LoginService.getCurrentUser();
        const userId = userobj?.sub || userobj?.id;
        

        if (!this.lobbyId || !userId) {
            await Modal.alert('Error', 'Missing game parameters');
            navigateTo('/pong');
            return;
        }

        const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        const wrapper = document.getElementById('canvas-wrapper') as HTMLDivElement;

        // 1. Initial Sizing
        this.fitCanvasToWrapper(canvas, wrapper);

        // 2. Setup Resize Observer (Updates size when window changes)
        this.resizeObserver = new ResizeObserver(() => {
            this.fitCanvasToWrapper(canvas, wrapper);
           
        });
        this.resizeObserver.observe(wrapper);

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
                matchId: this.lobbyId,
                side: this.side,
                userId: userId
            });

            gameManager.startGame();
            this.setupUIListeners();

        } catch (error) {
            console.error('Failed to start game:', error);
            await Modal.alert('Error', 'Failed to initialize game engine');
            navigateTo('/pong');
        }
    }

    /**
     * Sets internal canvas resolution to match CSS display size
     * This prevents blurry rendering
     */
    private fitCanvasToWrapper(canvas: HTMLCanvasElement, wrapper: HTMLElement) {
        // Set internal resolution to match displayed size
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
    }

    private setupUIListeners() {
        gameManager.on('game:score-update', (e: any) => {
            const p1 = document.getElementById('score-p1');
            const p2 = document.getElementById('score-p2');
            if(p1) p1.innerText = e.detail.player1Score;
            if(p2) p2.innerText = e.detail.player2Score;
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

