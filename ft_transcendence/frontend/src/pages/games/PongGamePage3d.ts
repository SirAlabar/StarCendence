import { BaseComponent } from '../../components/BaseComponent';
import { navigateTo } from '../../router/router';
import { gameManager } from '../../game/managers/PongManager';
import { LoginService } from '../../services/auth/LoginService';
import { Modal } from '../../components/common/Modal';
import { GameConfig } from '@/game/utils/GameTypes';
import { webSocketService } from '../../services/websocket/WebSocketService';

export default class Pong3DGamePage extends BaseComponent 
{
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
                    <canvas id="pong3DCanvas" style="display: block; width: 100%; height: 100%; background-color: #000000;"></canvas>
                </div>

                <div class="mt-3 text-muted">
                    <small>Controls: ${this.side === 'left' ? 'A / D (or W/S in top view)' : 'Arrow Left / Arrow Right (or Up/Down in top view)'} | Press C to Change Camera | Press ESC to Pause</small>
                </div>
            </div>
        `;
    }

    async mount(): Promise<void> 
    {
        const params = new URLSearchParams(window.location.search);
        this.gameId = params.get('gameId');
        this.side = (params.get('side') as 'left' | 'right') || 'left';
        const userobj = LoginService.getCurrentUser();
        const userId = userobj?.sub || userobj?.id;
        
        console.log('[Pong3DGamePage] 🎮 Mounting with gameId:', this.gameId, 'side:', this.side, 'userId:', userId);

        if (!this.gameId || !userId) 
        {
            console.error('[Pong3DGamePage] ❌ Missing game parameters');
            await Modal.alert('Error', 'Missing game parameters (gameId required)');
            navigateTo('/pong');
            return;
        }

        // Ensure WebSocket is connected
        if (!webSocketService.isConnected()) 
        {
            console.warn('[Pong3DGamePage] WebSocket not connected, attempting to connect...');
            try 
            {
                await webSocketService.connect();
            } 
            catch (error) 
            {
                console.error('[Pong3DGamePage] Failed to connect WebSocket:', error);
                await Modal.alert('Connection Error', 'Failed to connect to game server. Please try again.');
                navigateTo('/pong');
                return;
            }
        } 
        else 
        {
            console.log('[Pong3DGamePage] WebSocket already connected');
        }

        const canvas = document.getElementById('pong3DCanvas') as HTMLCanvasElement;
        const wrapper = document.getElementById('canvas-wrapper') as HTMLDivElement;
        
        if (!canvas || !wrapper)
        {
            await Modal.alert('Error', 'Game canvas not found');
            navigateTo('/pong');
            return;
        }

        this.fitCanvasToWrapper(canvas, wrapper);

        const gameConfig: GameConfig = 
        {
            mode: 'online-multiplayer',
            difficulty: 'easy',
            paddlecolor1: "neon",
            paddlecolor2: "neon",
            gamewidth: canvas.width, 
            gameheight: canvas.height
        };

        try 
        {
            console.log('[Pong3DGamePage] Initializing 3D game with config:', gameConfig);
            
            await gameManager.init3DGame(canvas, gameConfig, 
            {
                matchId: this.gameId,
                side: this.side,
                userId: userId
            });

            console.log('[Pong3DGamePage] Game initialized, starting game loop');
            
            this.setupUIListeners();
            gameManager.startGame();
            
            // Initialize scores to 0
            const p1 = document.getElementById('score-p1');
            const p2 = document.getElementById('score-p2');
            if (p1) 
                p1.innerText = '0';
            if (p2) 
                p2.innerText = '0';

            this.resizeObserver = new ResizeObserver(() => 
            {
                const oldWidth = canvas.width;
                const oldHeight = canvas.height;
                this.fitCanvasToWrapper(canvas, wrapper);
                if (oldWidth !== canvas.width || oldHeight !== canvas.height) {
                    console.log('[Pong3DGamePage] Canvas resized:', canvas.width, 'x', canvas.height);
                }
            });
            this.resizeObserver.observe(wrapper);

        } 
        catch (error) 
        {
            await Modal.alert('Error', 'Failed to initialize 3D game engine');
            navigateTo('/pong');
        }
    }

    private fitCanvasToWrapper(canvas: HTMLCanvasElement, wrapper: HTMLElement) 
    {
       
        const newWidth = wrapper.clientWidth;
        const newHeight = wrapper.clientHeight;
        if (newWidth > 0 && newHeight > 0) 
        {
            canvas.width = newWidth;
            canvas.height = newHeight;
        } 
        else 
        {
            canvas.width = 800;
            canvas.height = 600;
        }
    }

    private setupUIListeners() 
    {
        
        gameManager.on('game:score-update', (e: any) => 
        {
            console.log('[Pong3DGamePage] Score update received:', e.detail);
            const p1 = document.getElementById('score-p1');
            const p2 = document.getElementById('score-p2');
            if (p1) 
                p1.innerText = e.detail.player1Score?.toString() || '0';
            if (p2) 
                p2.innerText = e.detail.player2Score?.toString() || '0';
        });

        gameManager.on('game:ended', (e: any) => 
        {
            const winner = e.detail.winner;
            Modal.alert('Game Over', `${winner} Wins!`).then(() => {
                navigateTo('/pong');
            });
        });
    }

    dispose(): void 
    {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        gameManager.cleanup();
    }
}