import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';
import { webSocketService } from '@/services/websocket/WebSocketService';

export default class PongLobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
    private wsMessageHandler = (msg: any) => this.onWsMessage(msg);
    private lobbyId: string | null = null;
    private isGameStarting: boolean = false;

    private generateRoomId(): string 
    {
        // produce a numeric id with up to 8 digits
        try {
            const arr = new Uint32Array(1);
            if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
                crypto.getRandomValues(arr);
                let n = arr[0] % 100_000_000; // 0 .. 99_999_999
                if (n === 0) n = (Math.floor(Math.random() * 9) + 1); // avoid "0"
                return String(n);
            }
        } catch {
            // fallback to Math.random
        }
        let n = Math.floor(Math.random() * 100_000_000);
        if (n === 0) n = Math.floor(Math.random() * 9) + 1;
        return String(n);
    }

    /**
     * Wait for gameLobby to be fully mounted in DOM (with retry mechanism)
     */
    private async waitForLobbyReady(maxAttempts: number = 20, delay: number = 50): Promise<boolean> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Check if gameLobby exists
            if (!this.gameLobby) {
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // Check if DOM elements are ready (lobby container exists with player slots)
            const lobbyContainer = document.getElementById('lobbyContainer');
            const playerCards = lobbyContainer?.querySelectorAll('.player-card, [class*="player"]');
            
            if (lobbyContainer && playerCards && playerCards.length > 0) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.error(`[PongLobby] ❌ gameLobby not fully ready after ${maxAttempts} attempts`);
        return false;
    }

    render(): string 
    {
        return '<div id="lobbyContainer"></div>';
    }
    
    async mount(): Promise<void> 
    {
        // Connect to WebSocket if not already connected
        if (!webSocketService.isConnected()) {
            try {
                await webSocketService.connect();
            } catch (error) {
                console.error('[PongLobby] Failed to connect to WebSocket:', error);
                
                // Check if it's an authentication error
                if (error instanceof Error && error.message.includes('access token')) {
                    await Modal.alert(
                        'Authentication Required', 
                        'You need to be logged in to access the game lobby. Please login first.'
                    );
                    navigateTo('/login');
                } else {
                    await Modal.alert('Error', 'Failed to connect to game server');
                    navigateTo('/pong');
                }
                return;
            }
        }

        // Subscribe to all WebSocket messages
        webSocketService.on('*', this.wsMessageHandler);

        // Tell global chat notifications to filter messages from this lobby
        // (will be set after lobby ID is determined)

        const config: LobbyConfig = 
        {
            gameType: 'pong',
            maxPlayers: 2,
            onStartGame: () => this.startPongGame(),
            onBack: () => navigateTo('/pong')
        };
        
        this.gameLobby = new GameLobby(config);
        
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            container.innerHTML = this.gameLobby.render();
            this.gameLobby.mount();
        }

        // Check URL for lobby ID parameter
        const params = new URLSearchParams(window.location.search);
        const urlLobbyId = params.get('id');

        if (urlLobbyId) {
            // Joining existing lobby
            this.lobbyId = urlLobbyId;

            // Send join lobby message to server
            webSocketService.send('lobby:join', {
                lobbyId: this.lobbyId,
                gameType: 'pong'
            });
        } else {
            // Creating new lobby
            this.lobbyId = this.generateRoomId();

            // Update URL without reloading page
            const newUrl = `/pong-lobby?id=${this.lobbyId}`;
            console.log("navigating to ",this.lobbyId);
            window.history.replaceState(
                {},
                '',
                newUrl
            );

            // Send create lobby message to server
            webSocketService.send('lobby:create', {
                lobbyId: this.lobbyId,
                gameType: 'pong',
                maxPlayers: 2
            });
        }
    }

    private async onWsMessage(msg: any): Promise<void> {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'lobby:create:ack':
                // Acknowledgment for lobby creation
                if (!msg.payload?.success) {
                    console.error('[PongLobby] Failed to create lobby:', msg.payload?.reason);
                    await Modal.alert('Error', 'Failed to create lobby');
                    navigateTo('/pong');
                } else {
                    // Wait for gameLobby to be fully mounted
                    const isReady = await this.waitForLobbyReady();
                    
                    if (!isReady || !this.gameLobby) {
                        console.error('[PongLobby] ❌ gameLobby not ready after waiting!');
                        return;
                    }
                    
                    // Successfully created - load creator (self)
                    if (msg.payload.players && Array.isArray(msg.payload.players)) {
                        for (const playerData of msg.payload.players) {
                            await this.loadAndAddPlayer(playerData);
                        }
                    }
                }
                break;

            case 'lobby:join:ack':
                // Acknowledgment for lobby join
                if (!msg.payload?.success) {
                    const reason = msg.payload?.reason;
                    console.error('[PongLobby] Failed to join lobby:', reason);
                    
                    if (reason === 'room_full') {
                        await Modal.alert('Room Full', 'This lobby is already full. Please try another lobby.');
                    } else if (reason === 'room_not_found') {
                        await Modal.alert('Not Found', 'This lobby does not exist.');
                    } else {
                        await Modal.alert('Error', 'Failed to join lobby.');
                    }
                    
                    navigateTo('/pong');
                } else {
                    // Wait for gameLobby to be fully mounted in DOM
                    const isReady = await this.waitForLobbyReady();
                    
                    if (!isReady || !this.gameLobby) {
                        console.error('[PongLobby] ❌ gameLobby not ready after waiting!');
                        return;
                    }
                    
                    // Successfully joined - clear any existing players first (in case of refresh)
                    this.gameLobby.clearAllPlayers();
                    
                    // Load all existing players
                    if (msg.payload.players && Array.isArray(msg.payload.players)) {
                        for (let i = 0; i < msg.payload.players.length; i++) {
                            const playerData = msg.payload.players[i];
                            await this.loadAndAddPlayer(playerData);
                        }
                    }
                }
                break;

            case 'lobby:update':
                // Update lobby state (player list, settings, etc.)
                if (msg.payload?.lobbyId === this.lobbyId) {
                    this.gameLobby?.updateLobbyState?.(msg.payload);
                }
                break;

            case 'lobby:player:join':
                // New player joined
                if (msg.payload?.lobbyId === this.lobbyId) {
                    // Check if player is already in lobby (avoid duplicates)
                    if (this.gameLobby?.hasPlayer?.(msg.payload.userId)) {
                        return;
                    }
                    
                    await this.loadAndAddPlayer({
                        userId: msg.payload.userId,
                        username: msg.payload.username,
                        isHost: msg.payload.isHost,
                        isReady: msg.payload.isReady,
                    });
                }
                break;

            case 'lobby:player:leave':
                // Player left
                if (msg.payload?.lobbyId === this.lobbyId) {
                    this.gameLobby?.removePlayer?.(msg.payload.playerId);
                }
                break;

            case 'lobby:player:kicked':
                // You were kicked from the lobby
                if (msg.payload?.lobbyId === this.lobbyId) {
                    await Modal.alert('Kicked', 'You have been kicked from the lobby by the host.');
                    navigateTo('/pong');
                }
                break;

            case 'lobby:game:starting':
                // Game is about to start - navigate all players
                if (msg.payload?.lobbyId === this.lobbyId) {
                    this.isGameStarting = true;
                    navigateTo(`/pong-game?lobby=${this.lobbyId}`);
                }
                break;

            case 'lobby:chat':
                // Chat message
                if (msg.payload?.lobbyId === this.lobbyId) {
                    this.gameLobby?.addChatMessage?.(msg.payload);
                }
                break;

            case 'lobby:player:ready':
                // Player ready status changed
                if (msg.payload?.lobbyId === this.lobbyId) {
                    this.gameLobby?.updatePlayerReady?.(msg.payload.userId, msg.payload.isReady);
                }
                break;
        }
    }

    /**
     * Load player profile from UserService and add to lobby UI
     */
    private async loadAndAddPlayer(playerData: {
        userId: string;
        username: string;
        isHost: boolean;
        isReady: boolean;
        joinedAt?: number;
    }): Promise<void> {
        if (!this.gameLobby) {
            console.error('[PongLobby] ❌ gameLobby is null in loadAndAddPlayer!');
            return;
        }
        
        // Build player object directly from received data (no UserService call)
        const fullPlayerData = {
            id: playerData.userId,
            userId: playerData.userId,
            username: playerData.username,
            avatarUrl: '/assets/images/default-avatar.jpeg',
            isOnline: true,
            isReady: playerData.isReady || false,
            isHost: playerData.isHost || false,
            isAI: false,
            customization: null,
            joinedAt: playerData.joinedAt ? new Date(playerData.joinedAt) : new Date()
        };
        
        // Add to lobby UI
        this.gameLobby.addPlayer(fullPlayerData);
    }
    
    private async startPongGame(): Promise<void> 
    {
        // Send lobby:start event to backend
        if (this.lobbyId) {
            webSocketService.send('lobby:start', { lobbyId: this.lobbyId });
        } else {
            await Modal.alert('Error', 'Invalid lobby ID');
        }
    }
    
    public dispose(): void 
    {
        // Unsubscribe from WebSocket
        webSocketService.off('*', this.wsMessageHandler);

        // Only leave lobby if game is not starting (user is canceling/leaving manually)
        if (this.lobbyId && !this.isGameStarting) {
            webSocketService.send('lobby:leave', { lobbyId: this.lobbyId });
        }

        if (this.gameLobby) 
        {
            this.gameLobby.dispose();
            this.gameLobby = null;
        }
    }
} 