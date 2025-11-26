import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';
import { webSocketService } from '@/services/websocket/WebSocketService';
import UserService from '@/services/user/UserService';
import { globalChatNotifications } from '@/components/chat/GlobalChatNotifications';

export default class PongLobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
    private wsMessageHandler = (msg: any) => this.onWsMessage(msg);
    private lobbyId: string | null = null;

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
                console.log('[PongLobby] Connected to WebSocket');
            } catch (error) {
                console.error('[PongLobby] Failed to connect to WebSocket:', error);
                await Modal.alert('Error', 'Failed to connect to game server');
                navigateTo('/pong');
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

        console.log('[PongLobby] URL check - search:', window.location.search, 'id param:', urlLobbyId);

        if (urlLobbyId) {
            // Joining existing lobby
            this.lobbyId = urlLobbyId;
            console.log('[PongLobby] Joining existing lobby:', this.lobbyId);

            // Filter global chat notifications for this lobby
            globalChatNotifications.setCurrentLobby(this.lobbyId);

            // Send join lobby message to server
            webSocketService.send('lobby:join', {
                lobbyId: this.lobbyId,
                gameType: 'pong'
            });
        } else {
            // Creating new lobby
            this.lobbyId = this.generateRoomId();
            console.log('[PongLobby] Creating new lobby with ID:', this.lobbyId);

            // Filter global chat notifications for this lobby
            globalChatNotifications.setCurrentLobby(this.lobbyId);

            // Update URL without reloading page
            const newUrl = `/pong-lobby?id=${this.lobbyId}`;
            console.log('[PongLobby] Updating URL to:', newUrl);
            window.history.replaceState(
                {},
                '',
                newUrl
            );
            console.log('[PongLobby] URL after update:', window.location.href);

            // Send create lobby message to server
            webSocketService.send('lobby:create', {
                lobbyId: this.lobbyId,
                gameType: 'pong'
            });
        }
    }

    private async onWsMessage(msg: any): Promise<void> {
        if (!msg || !msg.type) return;

        console.log('[PongLobby] Received WS message:', msg);

        switch (msg.type) {
            case 'lobby:update':
                // Update lobby state (player list, settings, etc.)
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Lobby updated:', msg.payload);
                    this.gameLobby?.updateLobbyState?.(msg.payload);
                }
                break;

            case 'lobby:player:join':
                // New player joined
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Player joined:', msg.payload);
                    await this.handlePlayerJoin(msg.payload);
                }
                break;

            case 'lobby:player:leave':
                // Player left
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Player left:', msg.payload.playerId);
                    this.gameLobby?.removePlayer?.(msg.payload.playerId);
                }
                break;

            case 'lobby:game:starting':
                // Game is about to start
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Game starting!');
                    this.startPongGame();
                }
                break;

            case 'lobby:chat':
                // Chat message
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Chat message:', msg.payload.message);
                    this.gameLobby?.addChatMessage?.(msg.payload);
                }
                break;
        }
    }

    /**
     * Handle player join event - lookup user profile from user service
     */
    private async handlePlayerJoin(payload: any): Promise<void> {
        try {
            // If payload already has full player data (username, avatarUrl), use it
            if (payload.player?.username && payload.player?.avatarUrl) {
                this.gameLobby?.addPlayer?.(payload.player);
                return;
            }

            // Otherwise, lookup user by userId
            const userId = payload.player?.userId || payload.userId;
            if (!userId) {
                console.warn('[PongLobby] Player join event missing userId');
                return;
            }

            // Fetch user profile from user service
            const userProfile = await UserService.getUserById(userId);

            // Build full player object
            const playerData = {
                id: payload.player?.id || userId,
                userId: userId,
                username: userProfile.username,
                avatarUrl: userProfile.avatarUrl || '/assets/images/default-avatar.jpeg',
                isOnline: true,
                isReady: payload.player?.isReady || false,
                isHost: payload.player?.isHost || false,
                isAI: false,
                customization: payload.player?.customization || null,
                joinedAt: new Date()
            };

            // Add to lobby UI
            this.gameLobby?.addPlayer?.(playerData);

        } catch (error) {
            console.error('[PongLobby] Failed to lookup user profile:', error);
            // Fallback: add player with minimal data
            this.gameLobby?.addPlayer?.({
                id: payload.player?.id || payload.userId,
                userId: payload.userId,
                username: payload.username || 'Player',
                avatarUrl: '/assets/images/default-avatar.jpeg',
                isOnline: true,
                isReady: false,
                isHost: false,
                isAI: false,
                customization: null,
                joinedAt: new Date()
            });
        }
    }
    
    private async startPongGame(): Promise<void> 
    {
        // Navigate to game with lobby/room ID
        if (this.lobbyId) {
            navigateTo(`/pong-game?lobby=${this.lobbyId}`);
        } else {
            await Modal.alert('Error', 'Invalid lobby ID');
        }
    }
    
    public dispose(): void 
    {
        // Unsubscribe from WebSocket
        webSocketService.off('*', this.wsMessageHandler);

        // Clear lobby filter from global chat notifications
        globalChatNotifications.setCurrentLobby(null);

        // Leave lobby
        if (this.lobbyId) {
            webSocketService.send('lobby:leave', { lobbyId: this.lobbyId });
        }

        if (this.gameLobby) 
        {
            this.gameLobby.dispose();
            this.gameLobby = null;
        }
    }
} 