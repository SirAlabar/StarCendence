/**
 * WebSocket event types
 */
export enum WSEventType 
{
    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    ERROR = 'error',
    
    // Lobby events
    LOBBY_CREATE = 'lobby:create',
    LOBBY_JOIN = 'lobby:join',
    LOBBY_LEAVE = 'lobby:leave',
    LOBBY_UPDATE = 'lobby:update',
    LOBBY_START = 'lobby:start',
    
    // Invitation events
    INVITE_SEND = 'lobby:invite',
    INVITE_RECEIVED = 'lobby:invitation',
    INVITE_ACCEPT = 'lobby:accept',
    INVITE_DECLINE = 'lobby:decline',
    
    // Player events
    PLAYER_JOIN = 'lobby:player:join',
    PLAYER_LEAVE = 'lobby:player:leave',
    PLAYER_READY = 'lobby:ready',
    PLAYER_CUSTOMIZATION = 'lobby:customization',
    
    // Chat events
    CHAT_MESSAGE = 'lobby:chat',
    CHAT_HISTORY = 'lobby:chat:history',
    
    // Status events
    STATUS_UPDATE = 'user:status',
    FRIEND_ONLINE = 'friend:online',
    FRIEND_OFFLINE = 'friend:offline'
}

/**
 * WebSocket message interface
 */
export interface WSMessage<T = any> 
{
    event: WSEventType;
    data: T;
    timestamp: number;
}

/**
 * Connection status
 */
export enum ConnectionStatus 
{
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting',
    ERROR = 'error'
}

/**
 * Redis channel names
 */
export const RedisChannels = 
{
    lobby: (lobbyId: string) => `lobby:${lobbyId}`,
    lobbyPlayers: (lobbyId: string) => `lobby:${lobbyId}:players`,
    lobbyChat: (lobbyId: string) => `lobby:${lobbyId}:chat`,
    userInvitations: (userId: string) => `user:${userId}:invitations`,
    userStatus: (userId: string) => `user:${userId}:status`,
    friendStatus: (userId: string) => `user:${userId}:friends`
};