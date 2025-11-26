/**
 * Global WebSocket Message Handler
 * 
 * Centralized message handling system for WebSocket events across the application.
 * Provides global listeners for chat, notifications, lobby events, game events, etc.
 * 
 * Usage:
 * - Import and register handlers: `globalWebSocketHandler.registerChatHandler(callback)`
 * - Use for global features like chat notifications, friend status, etc.
 * - Pages can still use webSocketService.on() for local event handling
 */

import { webSocketService } from './WebSocketService';

export interface ChatMessage {
    id?: string;
    lobbyId?: string;
    channelId?: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    message: string;
    timestamp: number;
}

export interface FriendStatusUpdate {
    userId: string;
    username: string;
    status: 'online' | 'offline' | 'in-game' | 'in-lobby';
    gameType?: string;
    lobbyId?: string;
}

export interface Notification {
    id: string;
    type: 'invitation' | 'friend_request' | 'game_started' | 'achievement' | 'system';
    title: string;
    message: string;
    timestamp: number;
    data?: any;
}

export interface LobbyInvitation {
    invitationId: string;
    lobbyId: string;
    gameType: string;
    fromUserId: string;
    fromUsername: string;
    fromAvatarUrl?: string;
    timestamp: number;
    expiresAt?: number;
}

type ChatHandler = (message: ChatMessage) => void;
type FriendStatusHandler = (update: FriendStatusUpdate) => void;
type NotificationHandler = (notification: Notification) => void;
type InvitationHandler = (invitation: LobbyInvitation) => void;
type GenericHandler = (type: string, payload: any) => void;

class GlobalWebSocketHandler {
    private isInitialized = false;
    private chatHandlers: Set<ChatHandler> = new Set();
    private friendStatusHandlers: Set<FriendStatusHandler> = new Set();
    private notificationHandlers: Set<NotificationHandler> = new Set();
    private invitationHandlers: Set<InvitationHandler> = new Set();
    private genericHandlers: Set<GenericHandler> = new Set();

    /**
     * Initialize the global handler (call once on app startup)
     */
    initialize(): void {
        if (this.isInitialized) {
            return;
        }

        console.log('[GlobalWebSocketHandler] Initializing global message handlers');

        // Register wildcard listener to catch all messages
        webSocketService.on('*', this.handleMessage);

        this.isInitialized = true;
    }

    /**
     * Cleanup all handlers (call on app shutdown)
     */
    cleanup(): void {
        if (!this.isInitialized) {
            return;
        }

        console.log('[GlobalWebSocketHandler] Cleaning up global handlers');

        webSocketService.off('*', this.handleMessage);

        this.chatHandlers.clear();
        this.friendStatusHandlers.clear();
        this.notificationHandlers.clear();
        this.invitationHandlers.clear();
        this.genericHandlers.clear();

        this.isInitialized = false;
    }

    /**
     * Main message router - distributes messages to registered handlers
     */
    private handleMessage = (msg: any): void => {
        if (!msg || !msg.type) return;

        const { type, payload } = msg;

        // Route to generic handlers first (for logging, analytics, etc.)
        this.genericHandlers.forEach(handler => {
            try {
                handler(type, payload);
            } catch (error) {
                console.error('[GlobalWebSocketHandler] Generic handler error:', error);
            }
        });

        // Route to specific handlers based on message type
        switch (type) {
            // Chat messages
            case 'chat:message':
            case 'lobby:chat':
            case 'channel:chat':
                this.handleChatMessage(payload);
                break;

            // Friend status updates
            case 'friend:status':
            case 'user:status':
            case 'presence:update':
                this.handleFriendStatus(payload);
                break;

            // Notifications
            case 'notification':
            case 'notification:new':
                this.handleNotification(payload);
                break;

            // Invitations
            case 'lobby:invitation':
            case 'game:invitation':
            case 'invitation:received':
                this.handleInvitation(payload);
                break;

            default:
                // Other message types are handled by page-specific listeners
                break;
        }
    };

    /**
     * Handle chat messages
     */
    private handleChatMessage(payload: any): void {
        const chatMessage: ChatMessage = {
            id: payload.id || payload.messageId,
            lobbyId: payload.lobbyId,
            channelId: payload.channelId,
            userId: payload.userId || payload.playerId,
            username: payload.username || payload.playerName || 'Unknown',
            avatarUrl: payload.avatarUrl,
            message: payload.message || payload.text || '',
            timestamp: payload.timestamp || Date.now(),
        };

        this.chatHandlers.forEach(handler => {
            try {
                handler(chatMessage);
            } catch (error) {
                console.error('[GlobalWebSocketHandler] Chat handler error:', error);
            }
        });
    }

    /**
     * Handle friend status updates
     */
    private handleFriendStatus(payload: any): void {
        const statusUpdate: FriendStatusUpdate = {
            userId: payload.userId,
            username: payload.username || 'Unknown',
            status: payload.status || 'offline',
            gameType: payload.gameType,
            lobbyId: payload.lobbyId,
        };

        this.friendStatusHandlers.forEach(handler => {
            try {
                handler(statusUpdate);
            } catch (error) {
                console.error('[GlobalWebSocketHandler] Friend status handler error:', error);
            }
        });
    }

    /**
     * Handle notifications
     */
    private handleNotification(payload: any): void {
        const notification: Notification = {
            id: payload.id || `notif_${Date.now()}`,
            type: payload.type || 'system',
            title: payload.title || 'Notification',
            message: payload.message || '',
            timestamp: payload.timestamp || Date.now(),
            data: payload.data,
        };

        this.notificationHandlers.forEach(handler => {
            try {
                handler(notification);
            } catch (error) {
                console.error('[GlobalWebSocketHandler] Notification handler error:', error);
            }
        });
    }

    /**
     * Handle invitations
     */
    private handleInvitation(payload: any): void {
        const invitation: LobbyInvitation = {
            invitationId: payload.invitationId || payload.id,
            lobbyId: payload.lobbyId,
            gameType: payload.gameType || 'pong',
            fromUserId: payload.fromUserId || payload.userId,
            fromUsername: payload.fromUsername || payload.username || 'Unknown',
            fromAvatarUrl: payload.fromAvatarUrl || payload.avatarUrl,
            timestamp: payload.timestamp || Date.now(),
            expiresAt: payload.expiresAt,
        };

        this.invitationHandlers.forEach(handler => {
            try {
                handler(invitation);
            } catch (error) {
                console.error('[GlobalWebSocketHandler] Invitation handler error:', error);
            }
        });
    }

    // ===== Public API for registering handlers =====

    /**
     * Register a chat message handler (called for all chat messages)
     */
    registerChatHandler(handler: ChatHandler): () => void {
        this.chatHandlers.add(handler);
        // Return unsubscribe function
        return () => this.chatHandlers.delete(handler);
    }

    /**
     * Register a friend status update handler
     */
    registerFriendStatusHandler(handler: FriendStatusHandler): () => void {
        this.friendStatusHandlers.add(handler);
        return () => this.friendStatusHandlers.delete(handler);
    }

    /**
     * Register a notification handler
     */
    registerNotificationHandler(handler: NotificationHandler): () => void {
        this.notificationHandlers.add(handler);
        return () => this.notificationHandlers.delete(handler);
    }

    /**
     * Register an invitation handler
     */
    registerInvitationHandler(handler: InvitationHandler): () => void {
        this.invitationHandlers.add(handler);
        return () => this.invitationHandlers.delete(handler);
    }

    /**
     * Register a generic handler (receives all messages)
     * Useful for logging, analytics, debugging, etc.
     */
    registerGenericHandler(handler: GenericHandler): () => void {
        this.genericHandlers.add(handler);
        return () => this.genericHandlers.delete(handler);
    }

    /**
     * Unregister a specific handler
     */
    unregisterChatHandler(handler: ChatHandler): void {
        this.chatHandlers.delete(handler);
    }

    unregisterFriendStatusHandler(handler: FriendStatusHandler): void {
        this.friendStatusHandlers.delete(handler);
    }

    unregisterNotificationHandler(handler: NotificationHandler): void {
        this.notificationHandlers.delete(handler);
    }

    unregisterInvitationHandler(handler: InvitationHandler): void {
        this.invitationHandlers.delete(handler);
    }

    unregisterGenericHandler(handler: GenericHandler): void {
        this.genericHandlers.delete(handler);
    }

    /**
     * Check if handler is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// Export singleton instance
export const globalWebSocketHandler = new GlobalWebSocketHandler();
