import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';
import { PodConfig } from '../../game/utils/PodConfig';

export default class RacerLobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
    private wsConnection: WebSocket | null = null;
    private gameId: string | null = null;
    private selectedPod: PodConfig | null = null;
    private isReady: boolean = false;
    private isConnecting: boolean = false;
    
    render(): string 
    {
        if (this.isConnecting)
        {
            return `
                <div class="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
                    <div class="text-center">
                        <div class="text-6xl mb-4">🏎️</div>
                        <h2 class="text-2xl font-bold text-cyan-300 mb-2">Creating Race...</h2>
                        <p class="text-gray-400">Please wait...</p>
                    </div>
                </div>
            `;
        }
        
        return '<div id="lobbyContainer"></div>';
    }
    
    async mount(): void 
    {
        try
        {
            this.isConnecting = true;
            this.refresh();
            
            // 1. Create game session via HTTP
            const gameData = await this.createGameSession();
            this.gameId = gameData.gameId;
            
            console.log('✅ Game created:', this.gameId);
            
            // 2. Connect to WebSocket
            await this.connectWebSocket(this.gameId);
            
            console.log('✅ WebSocket connected');
            
            this.isConnecting = false;
            
            // 3. Setup lobby UI
            const config: LobbyConfig = 
            {
                gameType: 'podracer',
                maxPlayers: 4,
                onStartGame: () => this.startRace(),
                onBack: () => this.handleDisconnect(),
                onPodSelected: (pod: PodConfig) => this.handlePodSelection(pod),
                onReadyToggle: (ready: boolean) => this.handleReadyToggle(ready),
            };
            
            this.gameLobby = new GameLobby(config);
            
            const container = document.getElementById('lobbyContainer');
            if (container) 
            {
                container.innerHTML = this.gameLobby.render();
                this.gameLobby.mount();
            }
        }
        catch (error)
        {
            console.error('❌ Failed to initialize lobby:', error);
            Modal.showAlert('Error', 'Failed to create game session. Please try again.');
            navigateTo('/pod-racer');
        }
    }
    
    /**
     * Create game session via HTTP API
     */
    private async createGameSession(): Promise<{ gameId: string }>
    {
        try
        {
            const token = localStorage.getItem('token');
            if (!token)
            {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch('/api/games/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'RACER',
                    mode: 'MULTIPLAYER_4P',
                    maxPlayers: 4,
                    lapCount: 3
                })
            });
            
            if (!response.ok)
            {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create game');
            }
            
            const data = await response.json();
            return { gameId: data.gameId };
        }
        catch (error)
        {
            console.error('❌ Error creating game:', error);
            throw error;
        }
    }
    
    /**
     * Connect to WebSocket with game ID and token
     */
    private async connectWebSocket(gameId: string): Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                const token = localStorage.getItem('token');
                if (!token)
                {
                    reject(new Error('Not authenticated'));
                    return;
                }
                
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
                
                console.log('🔌 Connecting to WebSocket:', wsUrl);
                
                this.wsConnection = new WebSocket(wsUrl);
                
                this.wsConnection.onopen = () =>
                {
                    console.log('✅ WebSocket connected');
                    
                    // Send join message
                    this.sendMessage({
                        type: 'racer:join',
                        payload: {
                            gameId: gameId
                        }
                    });
                    
                    resolve();
                };
                
                this.wsConnection.onmessage = (event) =>
                {
                    try
                    {
                        const message = JSON.parse(event.data);
                        this.handleWebSocketMessage(message);
                    }
                    catch (error)
                    {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                };
                
                this.wsConnection.onerror = (error) =>
                {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                };
                
                this.wsConnection.onclose = (event) =>
                {
                    console.log('📴 WebSocket disconnected:', event.code, event.reason);
                    
                    if (event.code !== 1000) // Not a normal close
                    {
                        Modal.showAlert('Disconnected', 'Connection lost. Returning to menu.');
                        navigateTo('/pod-racer');
                    }
                };
                
                // Timeout after 10 seconds
                setTimeout(() =>
                {
                    if (this.wsConnection?.readyState !== WebSocket.OPEN)
                    {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);
            }
            catch (error)
            {
                reject(error);
            }
        });
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    private handleWebSocketMessage(message: any): void
    {
        console.log('📨 Received:', message.type, message.payload);
        
        switch (message.type)
        {
            case 'connection.ack':
                console.log('✅ Connection acknowledged');
                break;
                
            case 'racer:player_joined':
                this.onPlayerJoined(message.payload);
                break;
                
            case 'racer:player_left':
                this.onPlayerLeft(message.payload);
                break;
                
            case 'racer:pod_updated':
                this.onPodUpdated(message.payload);
                break;
                
            case 'racer:player_ready':
                this.onPlayerReady(message.payload);
                break;
                
            case 'racer:game_starting':
                this.onGameStarting(message.payload);
                break;
                
            case 'racer:race_started':
                this.onRaceStarted(message.payload);
                break;
                
            case 'system.error':
                this.onError(message.payload);
                break;
                
            default:
                console.log('⚠️ Unhandled message type:', message.type);
        }
    }
    
    /**
     * Send message via WebSocket
     */
    private sendMessage(message: any): void
    {
        if (this.wsConnection?.readyState === WebSocket.OPEN)
        {
            this.wsConnection.send(JSON.stringify(message));
            console.log('📤 Sent:', message.type);
        }
        else
        {
            console.error('❌ WebSocket not connected');
        }
    }
    
    /**
     * Handle pod selection
     */
    private handlePodSelection(pod: PodConfig): void
    {
        this.selectedPod = pod;
        
        this.sendMessage({
            type: 'racer:pod_selected',
            payload: {
                gameId: this.gameId,
                podId: pod.id,
                podConfig: pod
            }
        });
        
        console.log('🛸 Pod selected:', pod.name);
    }
    
    /**
     * Handle ready toggle
     */
    private handleReadyToggle(ready: boolean): void
    {
        this.isReady = ready;
        
        this.sendMessage({
            type: 'racer:ready',
            payload: {
                gameId: this.gameId,
                ready: ready
            }
        });
        
        console.log(ready ? '✅ Marked as ready' : '❌ Marked as not ready');
    }
    
    /**
     * Handle disconnect / back button
     */
    private handleDisconnect(): void
    {
        if (this.gameId && this.wsConnection?.readyState === WebSocket.OPEN)
        {
            this.sendMessage({
                type: 'racer:leave',
                payload: {
                    gameId: this.gameId
                }
            });
        }
        
        if (this.wsConnection)
        {
            this.wsConnection.close(1000, 'User left lobby');
        }
        
        navigateTo('/pod-racer');
    }
    
    /**
     * WebSocket event handlers
     */
    
    private onPlayerJoined(payload: any): void
    {
        console.log(`👋 Player joined: ${payload.username}`);
        
        // TODO: Update lobby UI to show new player
        if (this.gameLobby)
        {
            // You can add a method to GameLobby to update player list
            // this.gameLobby.updatePlayerSlots(payload);
        }
    }
    
    private onPlayerLeft(payload: any): void
    {
        console.log(`👋 Player left: ${payload.username}`);
        
        // TODO: Update lobby UI to remove player
    }
    
    private onPodUpdated(payload: any): void
    {
        console.log(`🛸 Player ${payload.username} selected pod ${payload.podId}`);
        
        // TODO: Update lobby UI to show pod selection
    }
    
    private onPlayerReady(payload: any): void
    {
        console.log(`${payload.ready ? '✅' : '❌'} Player ${payload.username} ready: ${payload.ready}`);
        
        // TODO: Update lobby UI to show ready status
    }
    
    private onGameStarting(payload: any): void
    {
        console.log(`🏁 Game starting in ${payload.countdown} seconds...`);
        
        Modal.showAlert('Get Ready!', `Race starting in ${payload.countdown} seconds...`);
    }
    
    private onRaceStarted(_payload: any): void
    {
        console.log('🏎️ Race started!');
        
        // Navigate to race page
        this.startRace();
    }
    
    private onError(payload: any): void
    {
        console.error('❌ Server error:', payload.message);
        
        Modal.showAlert('Error', payload.message || 'An error occurred');
    }
    
    /**
     * Start the race
     */
    private startRace(): void 
    {
        if (!this.gameId)
        {
            Modal.showAlert('Error', 'Game ID not found');
            return;
        }
        
        // Navigate to race page with gameId
        navigateTo(`/pod-racer/race?gameId=${this.gameId}`);
        
        // Note: WebSocket connection will be kept alive for the race
        // The race page will use the same connection
    }
    
    /**
     * Refresh the page content
     */
    private refresh(): void
    {
        const container = document.getElementById('game-content');
        if (container)
        {
            container.innerHTML = this.render();
        }
    }
    
    /**
     * Cleanup
     */
    public dispose(): void 
    {
        console.log('🧹 Disposing RacerLobbyPage');
        
        // Send leave message if connected
        if (this.gameId && this.wsConnection?.readyState === WebSocket.OPEN)
        {
            this.sendMessage({
                type: 'racer:leave',
                payload: {
                    gameId: this.gameId
                }
            });
        }
        
        // Close WebSocket
        if (this.wsConnection)
        {
            this.wsConnection.close(1000, 'Page disposed');
            this.wsConnection = null;
        }
        
        // Dispose lobby component
        if (this.gameLobby) 
        {
            this.gameLobby.dispose();
            this.gameLobby = null;
        }
        
        this.gameId = null;
        this.selectedPod = null;
        this.isReady = false;
    }
}