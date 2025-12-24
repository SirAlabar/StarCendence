import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';
import { webSocketService } from '@/services/websocket/WebSocketService';

export default class LobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
    private wsMessageHandler = (msg: any) => this.onWsMessage(msg);
    private lobbyId: string | null = null;
    private isGameStarting: boolean = false;
    private gameType: string = 'pong'; // Default to pong

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
        
        console.error(`[Lobby] ❌ gameLobby not fully ready after ${maxAttempts} attempts`);
        return false;
    }

    render(): string 
    {
        return '<div id="lobbyContainer"></div>';
    }
    
    async mount(): Promise<void> 
    {
        console.log('[Lobby] ===== MOUNT START =====');
        
        // Get game type from URL parameter
        const params = new URLSearchParams(window.location.search);
        const gameTypeParam = params.get('game');
        
        if (gameTypeParam) {
            this.gameType = gameTypeParam;
        }

        console.log('[Lobby] Game type:', this.gameType);

        // Determine max players based on game type
        const maxPlayers = this.gameType === 'racer' ? 4 : 2;
        const backRoute = this.gameType === 'racer' ? '/pod-racer' : '/pong';
        
        console.log('[Lobby] Max players:', maxPlayers);

        // Connect to WebSocket if not already connected
        if (!webSocketService.isConnected()) {
            try {
                await webSocketService.connect();
            } catch (error) {
                console.error('[Lobby] Failed to connect to WebSocket:', error);
                
                // Check if it's an authentication error
                if (error instanceof Error && error.message.includes('access token')) {
                    await Modal.alert(
                        'Authentication Required', 
                        'You need to be logged in to access the game lobby. Please login first.'
                    );
                    navigateTo('/login');
                } else {
                    await Modal.alert('Error', 'Failed to connect to game server');
                    navigateTo(backRoute);
                }
                return;
            }
        }

        // Subscribe to all WebSocket messages
        webSocketService.on('*', this.wsMessageHandler);

        const config: LobbyConfig = 
        {
            gameType: this.gameType === 'racer' ? 'podracer' : 'pong',
            maxPlayers,
            onStartGame: () => this.startGame(),
            onBack: () => navigateTo(backRoute)
        };
        
        this.gameLobby = new GameLobby(config);
        console.log('[Lobby] GameLobby instance created');
        
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            console.log('[Lobby] Mounting GameLobby...');
            // Mount will handle rendering - don't render before mount!
            await this.gameLobby.mount('#lobbyContainer');
            console.log('[Lobby] GameLobby mounted successfully');
        } else {
            console.error('[Lobby] Container #lobbyContainer not found!');
        }

        // Check URL for lobby ID parameter
        const urlLobbyId = params.get('id');

        console.log('[Lobby] URL lobby ID:', urlLobbyId);

        if (urlLobbyId) {
            // Joining existing lobby
            this.lobbyId = urlLobbyId;
            console.log('[Lobby] === JOINING EXISTING LOBBY:', this.lobbyId, '===');
            
            // Wait for lobby to be ready before sending join
            const isReady = await this.waitForLobbyReady();
            if (!isReady) {
                await Modal.alert('Error', 'Failed to initialize lobby. Please try again.');
                navigateTo(backRoute);
                return;
            }

            // Send join request
            webSocketService.send('lobby:join', { lobbyId: this.lobbyId });
        } else {
            // Creating new lobby
            console.log('[Lobby] === CREATING NEW LOBBY ===');
            
            // Wait for lobby to be ready before creating
            console.log('[Lobby] Waiting for lobby ready...');
            const isReady = await this.waitForLobbyReady();
            console.log('[Lobby] Lobby ready:', isReady);
            
            if (!isReady) {
                await Modal.alert('Error', 'Failed to initialize lobby. Please try again.');
                navigateTo(backRoute);
                return;
            }

            // Send create lobby request
            console.log('[Lobby] Sending lobby:create with:', { gameType: this.gameType, maxPlayers });
            webSocketService.send('lobby:create', { 
                gameType: this.gameType,
                maxPlayers 
            });
        }
        
        console.log('[Lobby] ===== MOUNT END =====');
    }

    /**
     * Handle WebSocket messages
     */
    private onWsMessage(message: any): void {
        console.log('[Lobby] Received WebSocket message:', message);

        switch (message.type) {
            case 'lobby:create:ack':
                this.handleLobbyCreated(message.payload);
                break;

            case 'lobby:join:ack':
                this.handleLobbyJoined(message.payload);
                break;

            case 'lobby:player:join':
                this.handlePlayerJoined(message.payload);
                break;

            case 'lobby:player:leave':
                this.handlePlayerLeft(message.payload);
                break;

            case 'lobby:player:ready':
                this.handlePlayerReady(message.payload);
                break;

            case 'lobby:player:kicked':
                this.handleKicked();
                break;

            case 'lobby:game:starting':
                this.handleGameStarting(message.payload);
                break;

            case 'lobby:chat':
                this.handleChat(message.payload);
                break;

            default:
                break;
        }
    }

    /**
     * Handle lobby created acknowledgment
     */
    private async handleLobbyCreated(payload: any): Promise<void> {
        console.log('[Lobby] ===== HANDLE LOBBY CREATED =====');
        console.log('[Lobby] Payload:', payload);
        
        if (!payload.success) {
            console.error('[Lobby] Failed to create lobby:', payload.reason);
            await Modal.alert('Error', 'Failed to create lobby. Please try again.');
            navigateTo(this.gameType === 'racer' ? '/pod-racer' : '/pong');
            return;
        }

        this.lobbyId = payload.lobbyId;
        console.log('[Lobby] ✅ Lobby created with ID:', this.lobbyId);

        // Update URL with lobby ID without reloading
        const newUrl = `/lobby?game=${this.gameType}&id=${this.lobbyId}`;
        window.history.pushState({}, '', newUrl);
        console.log('[Lobby] URL updated to:', newUrl);

        // Wait for lobby to be ready
        console.log('[Lobby] Waiting for lobby to be ready...');
        const isReady = await this.waitForLobbyReady();
        console.log('[Lobby] Lobby ready after wait:', isReady, 'gameLobby exists:', !!this.gameLobby);
        
        if (!isReady || !this.gameLobby) {
            console.error('[Lobby] ❌ gameLobby not ready after waiting!');
            return;
        }

        // Update lobby UI with all players (including host)
        if (payload.players) {
            console.log('[Lobby] 📋 Loading', payload.players.length, 'players:', payload.players);
            
            // Clear existing players first
            console.log('[Lobby] Clearing all players...');
            this.gameLobby.clearAllPlayers();
            
            // Add all players
            for (let i = 0; i < payload.players.length; i++) {
                const player = payload.players[i];
                console.log(`[Lobby] Loading player ${i + 1}/${payload.players.length}:`, player);
                await this.loadAndAddPlayer(player);
            }

            console.log('[Lobby] All players loaded. Checking host status before updateStartButtonArea...');
            console.log('[Lobby] isCurrentUserHost():', this.gameLobby.isCurrentUserHost());
            
            // Update start button area after loading players (host detection)
            console.log('[Lobby] 🔄 Calling updateStartButtonArea...');
            this.gameLobby.updateStartButtonArea();
            console.log('[Lobby] ✅ updateStartButtonArea completed');
        } else {
            console.warn('[Lobby] No players in payload!');
        }
        
        console.log('[Lobby] ===== HANDLE LOBBY CREATED END =====');
    }

    /**
     * Handle lobby joined acknowledgment
     */
    private async handleLobbyJoined(payload: any): Promise<void> {
        if (!payload.success) {
            console.error('[Lobby] Failed to join lobby:', payload.reason);
            
            let errorMessage = 'Failed to join lobby.';
            if (payload.reason === 'lobby_not_found') {
                errorMessage = 'Lobby not found. It may have been closed.';
            } else if (payload.reason === 'lobby_full') {
                errorMessage = 'Lobby is full.';
            } else if (payload.reason === 'lobby_in_game') {
                errorMessage = 'Game has already started.';
            }

            await Modal.alert('Error', errorMessage);
            navigateTo(this.gameType === 'racer' ? '/pod-racer' : '/pong');
            return;
        }

        console.log('[Lobby] Successfully joined lobby:', payload.lobbyId);

        // Wait for lobby to be ready
        const isReady = await this.waitForLobbyReady();
        if (!isReady || !this.gameLobby) {
            console.error('[Lobby] ❌ gameLobby not ready after waiting!');
            return;
        }

        // Update lobby UI with all players
        if (payload.players) {
            console.log('[Lobby] Updating UI with', payload.players.length, 'players');
            
            // Clear existing players first
            this.gameLobby.clearAllPlayers();
            
            // Add all players
            for (const player of payload.players) {
                await this.loadAndAddPlayer(player);
            }

            // Update start button area after loading players (host detection)
            console.log('[Lobby] handleLobbyJoined: Calling updateStartButtonArea');
            this.gameLobby.updateStartButtonArea();
        }
    }

    /**
     * Handle player joined
     */
    private async handlePlayerJoined(payload: any): Promise<void> {
        console.log('[Lobby] Player joined:', payload.username);
        
        if (this.gameLobby && !this.gameLobby.hasPlayer(payload.userId)) {
            await this.loadAndAddPlayer({
                userId: payload.userId,
                username: payload.username,
                isHost: payload.isHost,
                isReady: payload.isReady || false
            });
        }
    }

    /**
     * Handle player left
     */
    private handlePlayerLeft(payload: any): void {
        console.log('[Lobby] Player left:', payload.userId);
        
        if (this.gameLobby) {
            this.gameLobby.removePlayer(payload.userId);
        }
    }

    /**
     * Handle player ready status change
     */
    private handlePlayerReady(payload: any): void {
        console.log('[Lobby] Player ready status:', payload.username, payload.isReady);
        
        if (this.gameLobby) {
            this.gameLobby.updatePlayerReady(payload.userId, payload.isReady);
        }
    }

    /**
     * Handle being kicked from lobby
     */
    private async handleKicked(): Promise<void> {
        console.log('[Lobby] Kicked from lobby');
        
        await Modal.alert('Kicked', 'You have been removed from the lobby by the host.');
        navigateTo(this.gameType === 'racer' ? '/pod-racer' : '/pong');
    }

    /**
     * Handle game starting
     */
    private async handleGameStarting(payload: any): Promise<void> {
        if (this.isGameStarting) {
            console.log('[Lobby] Already processing game start');
            return;
        }

        this.isGameStarting = true;
        console.log('[Lobby] Game starting:', payload);

        // Wait a moment for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to appropriate game page based on game type
        if (this.gameType === 'racer') {
            console.log('[Lobby] Starting racer game...');
            // TODO: Navigate to racer game with gameId
            await Modal.alert('Info', 'Racer multiplayer not yet implemented');
            this.isGameStarting = false;
        } else {
            // Navigate to pong game
            console.log('[Lobby] Navigating to pong game:', payload.gameId);
            if(this.gameType === 'pong2d')
                navigateTo(`/pong-game?gameId=${payload.gameId}&lobbyId=${this.lobbyId}`);
            else if(this.gameType === 'pong3d')
                navigateTo(`/pong-game3d?gameId=${payload.gameId}&lobbyId=${this.lobbyId}`)
        }
    }

    /**
     * Handle lobby chat message
     */
    private handleChat(payload: any): void {
        if (this.gameLobby) {
            this.gameLobby.addChatMessage(payload);
        }
    }

    /**
     * Start game (called when host clicks Start );
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
            console.error('[Lobby] ❌ gameLobby is null in loadAndAddPlayer!');
            return;
        }

        // Add player with basic data first
        this.gameLobby.addPlayer({
            userId: playerData.userId,
            username: playerData.username,
            isHost: playerData.isHost,
            isReady: playerData.isReady,
            isOnline: true,
            isAI: false,
            avatarUrl: '/assets/images/default-avatar.jpeg'
        });

        // Try to load full profile asynchronously (won't block)
        try {
            const UserService = (await import('@/services/user/UserService')).default;
            await UserService.getProfile();
            
            // Update with full profile data if player still exists
            if (this.gameLobby.hasPlayer(playerData.userId)) {
                // Player card will auto-update with avatar
                console.log('[Lobby] Loaded profile for:', playerData.username);
            }
        } catch (error) {
            console.warn('[Lobby] Could not load full profile for:', playerData.username);
        }
    }

    /**
     * Start game (called when host clicks Start Game)
     */
    private startGame(): void {
        if (!this.lobbyId) {
            console.error('[Lobby] Cannot start game: no lobby ID');
            return;
        }

        console.log('[Lobby] Requesting game start for lobby:', this.lobbyId);
        webSocketService.send('lobby:start', { lobbyId: this.lobbyId });
    }

    public dispose(): void 
    {
        console.log('[Lobby] Disposing');
        
        // Unsubscribe from WebSocket messages
        webSocketService.off('*', this.wsMessageHandler);

        // Leave lobby if we were in one
        if (this.lobbyId && !this.isGameStarting) {
            console.log('[Lobby] Leaving lobby:', this.lobbyId);
            webSocketService.send('lobby:leave', { lobbyId: this.lobbyId });
        }

        if (this.gameLobby) 
        {
            this.gameLobby.dispose();
            this.gameLobby = null;
        }

        this.lobbyId = null;
        this.isGameStarting = false;
    }

    public get_gametype()
    {
        return this.gameType;
    }
}
