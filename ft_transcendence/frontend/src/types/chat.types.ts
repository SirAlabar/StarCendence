// Chat type definitions

// Chat message interface
export interface ChatMessage 
{
    id: string;
    conversationId?: string;
    senderId: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    
    // Sender information (included in backend responses)
    sender?: {
        id: string;
        username: string;
    };
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

// WebSocket chat event payload
export interface WebSocketChatPayload 
{
    messageId: string;
    senderId: string;
    senderUsername?: string;
    message: string;
    timestamp: number;
    conversationId?: string;
}

// Chat message payload for sending
export interface SendChatMessagePayload 
{
    targetUserId: string;
    message: string;
}

// Chat history response from backend
export interface ChatHistoryResponse 
{
    friendId: string;
    messages: ChatMessage[];
}

// Unread counts response from backend
export interface UnreadCountsResponse 
{
    unreadCounts: { [friendId: string]: number };
}

// Send message request for HTTP
export interface SendMessageRequest 
{
    receiverId: string;
    message: string;
}