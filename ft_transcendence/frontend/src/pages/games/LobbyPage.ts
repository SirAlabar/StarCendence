import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';
import { LoginService } from '@/services/auth/LoginService';
import { webSocketService } from '@/services/websocket/WebSocketService';
import UserService from '../../services/user/UserService';
import { UserProfile } from '../../types/user.types';

export default class LobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
    private wsMessageHandler = (msg: any) => this.onWsMessage(msg);
    private lobbyId: string | null = null;
    private isGameStarting: boolean = false;
    private gameType: string = 'pong'; // Default to pong
    private userProfile: UserProfile | null = null;

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
            
            // REMOVED: this.loadProfile(); (We do this once in mount() now)

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
        // 1. Load Profile FIRST so we have the avatar ready for the handshake
        await this.loadProfile();

        // Get game type from URL parameter
        const params = new URLSearchParams(window.location.search);
        const gameTypeParam = params.get('game');
        
        if (gameTypeParam) {
            this.gameType = gameTypeParam;
        }

        // Determine max players based on game type
        const maxPlayers = this.gameType === 'racer' ? 4 : 2;
        const backRoute = this.gameType === 'racer' ? '/pod-racer' : '/pong';
        
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
        
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            // Mount will handle rendering - don't render before mount!
            await this.gameLobby.mount('#lobbyContainer');
        } else {
            console.error('[Lobby] Container #lobbyContainer not found!');
        }

        // Check URL for lobby ID parameter
        const urlLobbyId = params.get('id');

        if (urlLobbyId) {
            // Joining existing lobby
            this.lobbyId = urlLobbyId;
            
            // Wait for lobby to be ready before sending join
            const isReady = await this.waitForLobbyReady();
            if (!isReady) {
                await Modal.alert('Error', 'Failed to initialize lobby. Please try again.');
                navigateTo(backRoute);
                return;
            }

            // Send join request WITH Avatar
            webSocketService.send('lobby:join', { 
                lobbyId: this.lobbyId,
                avatarUrl: this.userProfile?.avatarUrl
            });
        } else {
            // Creating new lobby
            
            // Wait for lobby to be ready before creating
            const isReady = await this.waitForLobbyReady();
            
            if (!isReady) {
                await Modal.alert('Error', 'Failed to initialize lobby. Please try again.');
                navigateTo(backRoute);
                return;
            }

            // Send create lobby request WITH Avatar
            webSocketService.send('lobby:create', { 
                gameType: this.gameType,
                maxPlayers,
                avatarUrl: this.userProfile?.avatarUrl
            });
        }
    }

    private async loadProfile(): Promise<void> 
    {
        try 
        {
            this.userProfile = await UserService.getProfile();
        } 
        catch (err) 
        {
            console.error('Failed to load profile:', err);
        }
    }

    /**
     * Handle WebSocket messages
     */
    private onWsMessage(message: any): void {
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

            case 'lobby:player:update': 
                this.handlePlayerUpdate(message.payload);
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

    private handlePlayerUpdate(payload: any): void {
        // payload should contain: { userId: string, paddle: string }
        if (this.gameLobby && payload.userId && payload.paddle) {
            this.gameLobby.updatePlayerPaddle(payload.userId, payload.paddle);
        }
    }

    /**
     * Handle lobby created acknowledgment
     */
    private async handleLobbyCreated(payload: any): Promise<void> {
        
        if (!payload.success) {
            console.error('[Lobby] Failed to create lobby:', payload.reason);
            await Modal.alert('Error', 'Failed to create lobby. Please try again.');
            navigateTo(this.gameType === 'racer' ? '/pod-racer' : '/pong');
            return;
        }

        this.lobbyId = payload.lobbyId;

        // Preserve any local paddle selection the host made before lobby ID was assigned
        let hostPendingPaddle: string | null = null;
        try {
            const userobj = LoginService.getCurrentUser();
            const currentUserId = userobj?.sub || userobj?.id;
            if (this.gameLobby) {
                const existing = this.gameLobby.getPlayerSlots().find(s => s.userId === currentUserId);
                if (existing && existing.paddleName) {
                    hostPendingPaddle = existing.paddleName;
                }
            }
        } catch (err) {
            // ignore
        }

        // Update URL with lobby ID without reloading
        const newUrl = `/lobby?game=${this.gameType}&id=${this.lobbyId}`;
        window.history.pushState({}, '', newUrl);

        // Wait for lobby to be ready
        const isReady = await this.waitForLobbyReady();
        
        if (!isReady || !this.gameLobby) {
            console.error('[Lobby] ❌ gameLobby not ready after waiting!');
            return;
        }

        // Update lobby UI with all players (including host)
        if (payload.players) {
            
            // Clear existing players first
            this.gameLobby.clearAllPlayers();
            
            // Add all players

      
            const player = payload.players[0];
            player.avatarUrl = this.userProfile?.avatarUrl;
      
             try
            {
                await this.loadAndAddPlayer(player);
            }
            catch(error)
            {

            }

            // If host had a pre-selection before lobby ID existed, send it now so server persists & broadcasts
            if (hostPendingPaddle && this.lobbyId) {
                webSocketService.send('lobby:player:update', {
                    lobbyId: this.lobbyId,
                    paddle: hostPendingPaddle
                });
            }

            // Update start button area after loading players (host detection)
            this.gameLobby.updateStartButtonArea();
        } else {
            console.warn('[Lobby] No players in payload!');
        }
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

        // Wait for lobby to be ready
        const isReady = await this.waitForLobbyReady();
        if (!isReady || !this.gameLobby) {
            console.error('[Lobby] ❌ gameLobby not ready after waiting!');
            return;
        }

        // Update lobby UI with all players
        if (payload.players) {
            console.log(payload)
            // Clear existing players first
            this.gameLobby.clearAllPlayers();
            
            // Add all players
            for (const player of payload.players) {
                await this.loadAndAddPlayer(player);
            }

            // Update start button area after loading players (host detection)
            this.gameLobby.updateStartButtonArea();
        }
    }

    /**
     * Handle player joined
     */
    private async handlePlayerJoined(payload: any): Promise<void> {
        if (this.gameLobby && !this.gameLobby.hasPlayer(payload.userId)) {
            await this.loadAndAddPlayer({
                userId: payload.userId,
                username: payload.username,
                avatarUrl: payload.avatarUrl, // This should come from the server now!
                isHost: payload.isHost,
                isReady: payload.isReady || false,
            });
        }
    }

    /**
     * Handle player left
     */
    private handlePlayerLeft(payload: any): void {
        if (this.gameLobby) {
            this.gameLobby.removePlayer(payload.userId);
        }
    }

    /**
     * Handle player ready status change
     */
    private handlePlayerReady(payload: any): void {
        if (this.gameLobby) {
            this.gameLobby.updatePlayerReady(payload.userId, payload.isReady);
        }
    }

    /**
     * Handle being kicked from lobby
     */
    private async handleKicked(): Promise<void> {
        await Modal.alert('Kicked', 'You have been removed from the lobby by the host.');
        navigateTo(this.gameType === 'racer' ? '/pod-racer' : '/pong');
    }

    /**
     * Handle game starting
     */
    private async handleGameStarting(payload: any): Promise<void> {
        if (this.isGameStarting) 
            return;
        this.isGameStarting = true;

        // 1. Determine side
        let playerSide: 'left' | 'right' = 'left';
        
        // 2. Prepare default colors
        let p1Color = 'default';
        let p2Color = 'default';

        if (this.gameLobby) 
        {
            playerSide = this.gameLobby.isCurrentUserHost() ? 'left' : 'right';

            const slots = this.gameLobby.getPlayerSlots();
            const p1 = slots.find(s => s.id === 0); 
            const p2 = slots.find(s => s.id === 1); 
            console.log(p1, p2)
           
            if (p1 && p1.paddleName) 
                p1Color = p1.paddleName.toLowerCase();
            if (p2 && p2.paddleName) 
                p2Color = p2.paddleName.toLowerCase();
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (this.gameType === 'racer') {
            await Modal.alert('Info', 'Racer multiplayer not yet implemented');
            this.isGameStarting = false;
        } else {
            const baseUrl = this.gameType === 'pong3d' ? '/pong-game3d' : '/pong-game';
            const url = `${baseUrl}?gameId=${payload.gameId}&side=${playerSide}&lobbyId=${this.lobbyId}&p1Color=${p1Color}&p2Color=${p2Color}`;
            
            navigateTo(url);
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
     * Load player profile from UserService and add to lobby UI
     */
    private async loadAndAddPlayer(playerData: {
        userId: string;
        username: string;
        avatarUrl?: string;
        isHost: boolean;
        isReady: boolean;
        joinedAt?: number;
    }): Promise<void> {
        if (!this.gameLobby) {
            console.error('[Lobby] ❌ gameLobby is null in loadAndAddPlayer!');
            return;
        }

        // 1. Prefer the avatar sent by the server/payload
        let finalAvatarUrl = playerData.avatarUrl; 

        
        if (!finalAvatarUrl) 
        {
            try {
                
                if (this.userProfile && this.userProfile.username === playerData.username) {
                     finalAvatarUrl = this.userProfile.avatarUrl;
                }
            } catch (e) {
                console.log("Could not load local profile match");
            }
        }

        
        finalAvatarUrl = finalAvatarUrl || '/assets/images/default-avatar.jpeg';

        console.log(`[Lobby] Adding player ${playerData.username} with avatar:`, finalAvatarUrl);
        
      
         this.gameLobby.addPlayer({
                userId: playerData.userId,
                username: playerData.username,
                avatarUrl: playerData.avatarUrl,
                isHost: playerData.isHost,
                isReady: playerData.isReady,
                isOnline: true,
                isAI: false,
            });
        

        // If playerData contains a paddle selection, update it in the UI
        if (playerData && (playerData as any).paddle) {
            this.gameLobby.updatePlayerPaddle(playerData.userId, (playerData as any).paddle);
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
        webSocketService.send('lobby:start', { lobbyId: this.lobbyId });
    }

    public dispose(): void 
    {
        // Unsubscribe from WebSocket messages
        webSocketService.off('*', this.wsMessageHandler);

        // Leave lobby if we were in one
        if (this.lobbyId && !this.isGameStarting) {
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
