// Chat type definitions

// Chat message interface
export interface ChatMessage 
{
    id: string;
    senderId: string;
    receiverId: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
}

// Chat conversation interface
export interface ChatConversation 
{
    friendId: string;
    friendUsername: string;
    friendAvatar: string | null;
    messages: ChatMessage[];
    unreadCount: number;
}

// Unread messages map type
export type UnreadMessagesMap = Map<string, number>;

// WebSocket chat event types
export enum ChatEventType 
{
    CHAT_MESSAGE_SENT = 'chat:message:sent',
    CHAT_MESSAGE_RECEIVED = 'chat:message:received',
    CHAT_HISTORY_REQUEST = 'chat:history:request',
    CHAT_HISTORY_RESPONSE = 'chat:history:response',
    MESSAGE_READ = 'chat:message:read',
    UNREAD_COUNT_UPDATE = 'chat:unread:update'
}

// Chat message payload for WebSocket
export interface ChatMessagePayload 
{
    receiverId: string;
    message: string;
    timestamp?: Date;
}

// Chat history response payload
export interface ChatHistoryPayload 
{
    friendId: string;
    messages: ChatMessage[];
}

// Unread count update payload
export interface UnreadCountPayload 
{
    friendId: string;
    count: number;
}