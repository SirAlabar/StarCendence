import { BaseComponent } from '../../components/BaseComponent';
import { gameManager } from '../../game/managers/PongManager';
import { navigateTo } from '../../router/router';
import { webSocketService } from '@/services/websocket/WebSocketService';

export default class PongGamePage extends BaseComponent {
    private canvas: HTMLCanvasElement | null = null;
    private wsMessageHandler = (msg: any) => this.onWsMessage(msg);
    private gameId: string | null = null;
    private lastInputTime: number = 0;
    private resizeListener: (() => void) | null = null;

    constructor() {
        super();
        // Get game/lobby ID from URL
        const params = new URLSearchParams(window.location.search);
        this.gameId = params.get('lobby') || params.get('game');
    }

    render(): string {
        return `
            <div class="w-full h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
                <div class="w-full py-4 px-8 border-b border-cyan-500/30 bg-black/40 flex-shrink-0">
                    <h1 class="text-3xl font-bold text-cyan-300 text-center glow-text-cyan">
                        ONLINE PONG
                    </h1>
                </div>
                
                <div class="flex-1 flex items-center justify-center p-4">
                    <div class="relative w-full max-w-7xl">
                        <canvas 
                            id="pongCanvas" 
                            class="w-full h-full rounded-2xl border-2 border-cyan-500 bg-black shadow-2xl shadow-cyan-500/50"
                            style="aspect-ratio: 4/3; max-height: 85vh;"
                        ></canvas>
                        
                        <div id="gameInfo" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-6 py-2 rounded-lg border border-cyan-500/50">
                            <p class="text-cyan-300 font-bold text-sm">Waiting for game state...</p>
                        </div>
                    </div>
                </div>
                
                <style>
                    .glow-text-cyan {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                </style>
            </div>
        `;
    }

    async mount(): Promise<void> {
        if (!this.gameId) {
            console.error('[PongGame] No game ID provided');
            navigateTo('/pong');
            return;
        }

        this.canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        if (!this.canvas) {
            console.error('[PongGame] Canvas not found');
            return;
        }

        // Connect to WebSocket
        if (!webSocketService.isConnected()) {
            try {
                await webSocketService.connect();
                console.log('[PongGame] Connected to WebSocket');
            } catch (error) {
                console.error('[PongGame] Failed to connect:', error);
                this.updateGameInfo('Failed to connect to server');
                setTimeout(() => navigateTo('/pong'), 2000);
                return;
            }
        }

        // Subscribe to game updates
        webSocketService.on('*', this.wsMessageHandler);

        // Join game room
        webSocketService.send('game:join', {
            gameId: this.gameId
        });

        console.log('[PongGame] Joined game:', this.gameId);

        // Setup input handlers
        this.setupInputHandlers();

        // Initialize canvas size
        this.resizeCanvas();
        this.resizeListener = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeListener);
    }

    private onWsMessage(msg: any): void {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'game.update':
                // Authoritative game state from server
                if (msg.payload?.gameId === this.gameId || msg.gameId === this.gameId) {
                    this.applyGameState(msg.payload || msg.data);
                }
                break;

            case 'game.event':
                // Game events (goal, round start, etc.)
                if (msg.payload?.gameId === this.gameId || msg.gameId === this.gameId) {
                    this.handleGameEvent(msg.payload?.event || msg.event);
                }
                break;

            case 'game.started':
                console.log('[PongGame] Game started!');
                this.updateGameInfo('Game Started!');
                break;

            case 'game.ended':
                console.log('[PongGame] Game ended:', msg.payload);
                this.handleGameEnd(msg.payload);
                break;
        }
    }

    private applyGameState(state: any): void {
        if (!state) return;

        // Apply state to game engine if it supports remote state
        if (typeof (gameManager as any).applyRemoteState === 'function') {
            (gameManager as any).applyRemoteState(state);
        } else {
            // Otherwise render directly to canvas
            this.renderGameState(state);
        }
    }

    private renderGameState(state: any): void {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw based on state
        if (state.pong) {
            // Draw ball
            if (state.pong.ball) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(state.pong.ball.x, state.pong.ball.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw paddles
            if (state.pong.paddles) {
                ctx.fillStyle = 'white';
                state.pong.paddles.forEach((paddle: any) => {
                    const x = paddle.playerNumber === 1 ? 20 : this.canvas!.width - 30;
                    const paddleHeight = paddle.height || 80;
                    const paddleWidth = paddle.width || 10;
                    ctx.fillRect(x, paddle.y, paddleWidth, paddleHeight);
                });
            }
        }

        // Draw scores
        if (state.scores && Array.isArray(state.scores)) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(String(state.scores[0] || 0), this.canvas.width / 4, 60);
            ctx.fillText(String(state.scores[1] || 0), (this.canvas.width * 3) / 4, 60);
        }
    }

    private handleGameEvent(event: any): void {
        console.log('[PongGame] Game event:', event);

        if (event.type === 'goal-scored' || event.type === 'goal_scored') {
            const scores = event.newScore || event.scores || [];
            this.updateGameInfo(`Goal! Score: ${scores.join(' - ')}`);
            setTimeout(() => this.updateGameInfo(''), 2000);
        }
    }

    private handleGameEnd(payload: any): void {
        const winner = payload.winner;
        const winnerName = winner?.username || winner?.playerName || 'Unknown';
        this.updateGameInfo(`Game Over! Winner: ${winnerName}`);

        setTimeout(() => {
            navigateTo('/pong');
        }, 4000);
    }

    private setupInputHandlers(): void {
        if (!this.canvas) return;

        // Mouse/touch input
        const handleMove = (clientY: number) => {
            this.sendInput(clientY);
        };

        this.canvas.addEventListener('mousemove', (e) => {
            handleMove(e.clientY);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches[0]) {
                e.preventDefault();
                handleMove(e.touches[0].clientY);
            }
        });

        // Keyboard input (arrow keys)
        const handleKeyboard = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                webSocketService.send('player.input', {
                    gameId: this.gameId,
                    input: {
                        type: 'keyboard',
                        key: e.key
                    }
                });
            }
        };

        window.addEventListener('keydown', handleKeyboard);
    }

    private sendInput(clientY: number): void {
        if (!this.canvas || !this.gameId) return;

        // Throttle input to ~60fps
        const now = Date.now();
        if (now - this.lastInputTime < 16) return; // ~60fps
        this.lastInputTime = now;

        const rect = this.canvas.getBoundingClientRect();
        const y = clientY - rect.top;

        webSocketService.send('player.input', {
            gameId: this.gameId,
            input: {
                type: 'pointer',
                y: y
            }
        });
    }

    private resizeCanvas(): void {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;

        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Only log if size actually changed
        if (oldWidth !== this.canvas.width || oldHeight !== this.canvas.height) {
            console.log('[PongGame] Canvas resized:', this.canvas.width, 'x', this.canvas.height);
        }
    }

    private updateGameInfo(message: string): void {
        const info = document.getElementById('gameInfo');
        if (info) {
            if (message) {
                info.innerHTML = `<p class="text-cyan-300 font-bold text-sm">${message}</p>`;
            } else {
                info.style.display = 'none';
            }
        }
    }

    public dispose(): void {
        // Unsubscribe from WebSocket
        webSocketService.off('*', this.wsMessageHandler);

        // Leave game
        if (this.gameId) {
            webSocketService.send('game:leave', { gameId: this.gameId });
        }

        // Cleanup game manager
        gameManager.cleanup();

        // Remove resize listener
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }
}
