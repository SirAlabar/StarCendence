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
                console.log(`[PongLobby] ⏳ Waiting for gameLobby initialization... attempt ${attempt + 1}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // Check if DOM elements are ready (lobby container exists with player slots)
            const lobbyContainer = document.getElementById('lobbyContainer');
            const playerCards = lobbyContainer?.querySelectorAll('.player-card, [class*="player"]');
            
            if (lobbyContainer && playerCards && playerCards.length > 0) {
                console.log(`[PongLobby] ✅ gameLobby fully mounted after ${attempt} attempts (found ${playerCards.length} player slots)`);
                return true;
            }
            
            console.log(`[PongLobby] ⏳ Waiting for gameLobby DOM... attempt ${attempt + 1}/${maxAttempts}`);
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
                console.log('[PongLobby] Connected to WebSocket');
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

            // Send join lobby message to server
            webSocketService.send('lobby:join', {
                lobbyId: this.lobbyId,
                gameType: 'pong'
            });
        } else {
            // Creating new lobby
            this.lobbyId = this.generateRoomId();
            console.log('[PongLobby] Creating new lobby with ID:', this.lobbyId);

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
                gameType: 'pong',
                maxPlayers: 2
            });
        }
    }

    private async onWsMessage(msg: any): Promise<void> {
        if (!msg || !msg.type) return;

        console.log('[PongLobby] Received WS message:', msg);

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
                    console.log('[PongLobby] Successfully created lobby, loading players');
                    if (msg.payload.players && Array.isArray(msg.payload.players)) {
                        for (const playerData of msg.payload.players) {
                            await this.loadAndAddPlayer(playerData);
                        }
                    }
                }
                break;

            case 'lobby:join:ack':
                // Acknowledgment for lobby join
                console.log('[PongLobby] 🔍 DEBUG lobby:join:ack:', msg.payload);
                
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
                    console.log('[PongLobby] 🔍 Step 1: Clearing existing players');
                    this.gameLobby.clearAllPlayers();
                    
                    // Load all existing players
                    console.log('[PongLobby] 🔍 Step 2: Players array from payload:', msg.payload.players);
                    
                    if (msg.payload.players && Array.isArray(msg.payload.players)) {
                        console.log(`[PongLobby] 🔍 Step 3: Loading ${msg.payload.players.length} players`);
                        
                        for (let i = 0; i < msg.payload.players.length; i++) {
                            const playerData = msg.payload.players[i];
                            console.log(`[PongLobby] 🔍 Step 4.${i}: Loading player`, playerData);
                            await this.loadAndAddPlayer(playerData);
                            console.log(`[PongLobby] 🔍 Step 4.${i}: Player loaded successfully`);
                        }
                        
                        console.log('[PongLobby] 🔍 Step 5: All players loaded!');
                    } else {
                        console.warn('[PongLobby] ⚠️ No players array in payload or not an array');
                    }
                }
                break;

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
                    console.log('[PongLobby] Player isHost value:', msg.payload.isHost);
                    
                    // Check if player is already in lobby (avoid duplicates)
                    if (this.gameLobby?.hasPlayer?.(msg.payload.userId)) {
                        console.log('[PongLobby] ⚠️ Player already in lobby, skipping');
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
                    console.log('[PongLobby] Player left:', msg.payload.playerId);
                    this.gameLobby?.removePlayer?.(msg.payload.playerId);
                }
                break;

            case 'lobby:player:kicked':
                // You were kicked from the lobby
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] You were kicked from the lobby');
                    await Modal.alert('Kicked', 'You have been kicked from the lobby by the host.');
                    navigateTo('/pong');
                }
                break;

            case 'lobby:game:starting':
                // Game is about to start - navigate all players
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Game starting! Navigating to game...');
                    navigateTo(`/pong-game?lobby=${this.lobbyId}`);
                }
                break;

            case 'lobby:chat':
                // Chat message
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Chat message:', msg.payload.message);
                    this.gameLobby?.addChatMessage?.(msg.payload);
                }
                break;

            case 'lobby:player:ready':
                // Player ready status changed
                if (msg.payload?.lobbyId === this.lobbyId) {
                    console.log('[PongLobby] Player ready status:', msg.payload);
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
        console.log('[PongLobby] 🔍 loadAndAddPlayer START:', {
            userId: playerData.userId,
            username: playerData.username,
            isHost: playerData.isHost,
            isHostType: typeof playerData.isHost
        });
        
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

        console.log('[PongLobby] 🔍 Calling addPlayer with:', {
            username: fullPlayerData.username,
            isHost: fullPlayerData.isHost
        });
        
        // Add to lobby UI
        this.gameLobby.addPlayer(fullPlayerData);
        
        console.log('[PongLobby] 🔍 loadAndAddPlayer COMPLETE');
    }
    
    private async startPongGame(): Promise<void> 
    {
        // Send lobby:start event to backend
        if (this.lobbyId) {
            console.log('[PongLobby] Sending lobby:start event');
            webSocketService.send('lobby:start', { lobbyId: this.lobbyId });
        } else {
            await Modal.alert('Error', 'Invalid lobby ID');
        }
    }
    
    public dispose(): void 
    {
        // Unsubscribe from WebSocket
        webSocketService.off('*', this.wsMessageHandler);

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