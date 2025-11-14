import { WSEventType, ConnectionStatus } from '../../types/websocket.types';
import { Lobby, LobbyInvitation, LobbyChatMessage } from '../../types/lobby.types';

class WebSocketService 
{
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private listeners: Map<string, Function[]> = new Map();
    
    constructor() 
    {
        console.log('[WebSocket] 🔧 Mock service initialized');
    }
    
    async connect(): Promise<void> 
    {
        console.log('[WebSocket] 🔌 Connecting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        this.status = ConnectionStatus.CONNECTED;
        console.log('[WebSocket] ✅ Connected');
        this.emit(WSEventType.CONNECT, { timestamp: Date.now() });
    }
    
    disconnect(): void 
    {
        console.log('[WebSocket] 🔌 Disconnecting');
        this.status = ConnectionStatus.DISCONNECTED;
        this.emit(WSEventType.DISCONNECT, { timestamp: Date.now() });
    }
    
    getStatus(): ConnectionStatus 
    {
        return this.status;
    }
    
    isConnected(): boolean 
    {
        return this.status === ConnectionStatus.CONNECTED;
    }
    
    async createLobby(gameType: 'pong' | 'podracer', maxPlayers: number): Promise<string> 
    {
        console.log('[WebSocket] 🎮 Creating lobby', { gameType, maxPlayers });
        await new Promise(resolve => setTimeout(resolve, 300));
        const lobbyId = `lobby_${Date.now()}`;
        console.log('[WebSocket] ✅ Lobby created:', lobbyId);
        return lobbyId;
    }
    
    async joinLobby(lobbyId: string): Promise<void> 
    {
        console.log('[WebSocket] 🚪 Joining lobby:', lobbyId);
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[WebSocket] ✅ Joined lobby');
    }
    
    async leaveLobby(lobbyId: string): Promise<void> 
    {
        console.log('[WebSocket] 🚪 Leaving lobby:', lobbyId);
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('[WebSocket] ✅ Left lobby');
    }
    
    async sendInvitation(lobbyId: string, friendUserId: string): Promise<void> 
    {
        console.log('[WebSocket] 📨 Sending invitation via Redis pub/sub', { lobbyId, friendUserId });
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('[WebSocket] ✅ Invitation sent to Redis');
    }
    
    async acceptInvitation(invitationId: string): Promise<void> 
    {
        console.log('[WebSocket] ✅ Accepting invitation:', invitationId);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    async declineInvitation(invitationId: string): Promise<void> 
    {
        console.log('[WebSocket] ❌ Declining invitation:', invitationId);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    async updateReadyStatus(lobbyId: string, isReady: boolean): Promise<void> 
    {
        console.log('[WebSocket] 🎯 Updating ready status', { lobbyId, isReady });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    async updateCustomization(lobbyId: string, _customization: any): Promise<void> 
    {
        console.log('[WebSocket] 🎨 Updating customization', { lobbyId });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    async sendChatMessage(lobbyId: string, message: string): Promise<void> 
    {
        console.log('[WebSocket] 💬 Sending chat message', { lobbyId, message });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    onLobbyUpdate(lobbyId: string, callback: (lobby: Lobby) => void): void 
    {
        console.log('[WebSocket] 👂 Registered lobby update listener:', lobbyId);
        this.addListener(`${WSEventType.LOBBY_UPDATE}:${lobbyId}`, callback);
    }
    
    onPlayerJoin(lobbyId: string, callback: (player: any) => void): void 
    {
        console.log('[WebSocket] 👂 Registered player join listener:', lobbyId);
        this.addListener(`${WSEventType.PLAYER_JOIN}:${lobbyId}`, callback);
    }
    
    onPlayerLeave(lobbyId: string, callback: (playerId: string) => void): void 
    {
        console.log('[WebSocket] 👂 Registered player leave listener:', lobbyId);
        this.addListener(`${WSEventType.PLAYER_LEAVE}:${lobbyId}`, callback);
    }
    
    onInvitationReceived(callback: (invitation: LobbyInvitation) => void): void 
    {
        console.log('[WebSocket] 👂 Registered invitation listener');
        this.addListener(WSEventType.INVITE_RECEIVED, callback);
    }
    
    onChatMessage(lobbyId: string, callback: (message: LobbyChatMessage) => void): void 
    {
        console.log('[WebSocket] 👂 Registered chat message listener:', lobbyId);
        this.addListener(`${WSEventType.CHAT_MESSAGE}:${lobbyId}`, callback);
    }
    
    subscribeFriendsStatus(callback: (userId: string, status: string) => void): void 
    {
        console.log('[WebSocket] 👂 Subscribing to friend status updates via Redis pub/sub');
        this.addListener(WSEventType.STATUS_UPDATE, callback);
    }
    
    unsubscribeFriendsStatus(): void 
    {
        console.log('[WebSocket] 🔇 Unsubscribing from friend status updates');
        this.removeListener(WSEventType.STATUS_UPDATE);
    }
    
    unsubscribeLobby(lobbyId: string): void 
    {
        console.log('[WebSocket] 🔇 Unsubscribing from lobby:', lobbyId);
        this.removeListener(`${WSEventType.LOBBY_UPDATE}:${lobbyId}`);
        this.removeListener(`${WSEventType.PLAYER_JOIN}:${lobbyId}`);
        this.removeListener(`${WSEventType.PLAYER_LEAVE}:${lobbyId}`);
        this.removeListener(`${WSEventType.CHAT_MESSAGE}:${lobbyId}`);
    }
    
    private addListener(event: string, callback: Function): void 
    {
        if (!this.listeners.has(event)) 
        {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }
    
    private removeListener(event: string): void 
    {
        this.listeners.delete(event);
    }
    
    private emit(event: string, data: any): void 
    {
        const callbacks = this.listeners.get(event);
        if (callbacks) 
        {
            callbacks.forEach(cb => 
            {
                try 
                {
                    cb(data);
                }
                catch (error) 
                {
                    console.error('[WebSocket] Error in listener:', error);
                }
            });
        }
    }
}

export const webSocketService = new WebSocketService();