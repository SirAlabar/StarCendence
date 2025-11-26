/**
 * Notification Manager Service
 * 
 * Central service for managing application notifications:
 * - Receives notifications from GlobalWebSocketHandler
 * - Persists notifications in localStorage
 * - Provides EventEmitter for UI components
 * - Manages notification state (read/unread)
 * - Handles notification actions (accept/decline invitations)
 */

import { 
    globalWebSocketHandler, 
    type Notification as GlobalNotification,
    type ChatMessage,
    type LobbyInvitation
} from '../websocket/GlobalWebSocketHandler';
import { webSocketService } from '../websocket/WebSocketService';

// Extended notification type with additional fields for our system
export interface AppNotification {
    id: string;
    type: 'chat' | 'invitation' | 'friend_request' | 'game_started' | 'achievement' | 'system';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    priority: 'high' | 'normal' | 'low';
    
    // Optional fields for specific notification types
    data?: {
        userId?: string;
        username?: string;
        avatarUrl?: string;
        lobbyId?: string;
        invitationId?: string;
        gameType?: string;
        expiresAt?: number;
        chatId?: string;
        [key: string]: any;
    };
    
    // For invitations and friend requests
    actionable?: boolean;
    actionPending?: boolean;
}

type NotificationListener = (notifications: AppNotification[]) => void;
type UnreadCountListener = (count: number) => void;

class NotificationManager {
    private notifications: AppNotification[] = [];
    private listeners: Set<NotificationListener> = new Set();
    private unreadCountListeners: Set<UnreadCountListener> = new Set();
    private isInitialized = false;
    
    private readonly STORAGE_KEY = 'app_notifications';
    private readonly MAX_NOTIFICATIONS = 100; // Keep last 100 notifications
    
    private unsubscribeFunctions: (() => void)[] = [];

    /**
     * Initialize the notification manager
     */
    initialize(): void {
        if (this.isInitialized) {
            return;
        }

        console.log('[NotificationManager] Initializing...');

        // Load notifications from localStorage
        this.loadFromStorage();

        // Register handlers with GlobalWebSocketHandler
        const unsubChat = globalWebSocketHandler.registerChatHandler(this.handleChatMessage);
        const unsubNotif = globalWebSocketHandler.registerNotificationHandler(this.handleNotification);
        const unsubInvite = globalWebSocketHandler.registerInvitationHandler(this.handleInvitation);

        this.unsubscribeFunctions.push(unsubChat, unsubNotif, unsubInvite);

        this.isInitialized = true;
        console.log('[NotificationManager] Initialized with', this.notifications.length, 'stored notifications');
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        if (!this.isInitialized) {
            return;
        }

        console.log('[NotificationManager] Cleaning up...');

        // Unsubscribe from GlobalWebSocketHandler
        this.unsubscribeFunctions.forEach(fn => fn());
        this.unsubscribeFunctions = [];

        this.listeners.clear();
        this.unreadCountListeners.clear();

        this.isInitialized = false;
    }

    // ===== WebSocket Event Handlers =====

    /**
     * Handle incoming chat messages (1-1 DMs only, not lobby chat)
     */
    private handleChatMessage = (message: ChatMessage): void => {
        // Only create notifications for 1-1 DMs, not lobby/channel chat
        if (message.lobbyId || message.channelId) {
            return; // Lobby and channel chat handled elsewhere
        }

        const notification: AppNotification = {
            id: `chat_${message.id || Date.now()}`,
            type: 'chat',
            title: message.username,
            message: message.message,
            timestamp: message.timestamp,
            read: false,
            priority: 'normal',
            data: {
                userId: message.userId,
                username: message.username,
                avatarUrl: message.avatarUrl,
                chatId: message.id,
            },
            actionable: false,
        };

        this.addNotification(notification);
    };

    /**
     * Handle incoming notifications
     */
    private handleNotification = (notification: GlobalNotification): void => {
        const appNotification: AppNotification = {
            id: notification.id,
            type: notification.type === 'friend_request' ? 'friend_request' : 
                  notification.type === 'game_started' ? 'game_started' :
                  notification.type === 'achievement' ? 'achievement' : 'system',
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp,
            read: false,
            priority: notification.type === 'friend_request' ? 'high' : 'normal',
            data: notification.data,
            actionable: notification.type === 'friend_request',
        };

        this.addNotification(appNotification);
    };

    /**
     * Handle incoming lobby invitations
     */
    private handleInvitation = (invitation: LobbyInvitation): void => {
        const notification: AppNotification = {
            id: `invite_${invitation.invitationId}`,
            type: 'invitation',
            title: `${invitation.fromUsername} invited you to play`,
            message: `Join ${invitation.gameType} lobby`,
            timestamp: invitation.timestamp,
            read: false,
            priority: 'high',
            data: {
                userId: invitation.fromUserId,
                username: invitation.fromUsername,
                avatarUrl: invitation.fromAvatarUrl,
                lobbyId: invitation.lobbyId,
                invitationId: invitation.invitationId,
                gameType: invitation.gameType,
                expiresAt: invitation.expiresAt,
            },
            actionable: true,
        };

        this.addNotification(notification);
    };

    // ===== Public API =====

    /**
     * Get all notifications
     */
    getAll(): AppNotification[] {
        return [...this.notifications];
    }

    /**
     * Get unread count
     */
    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    /**
     * Mark a notification as read
     */
    markAsRead(id: string): void {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveToStorage();
            this.notifyListeners();
            this.notifyUnreadCountListeners();
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void {
        let changed = false;
        this.notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        });

        if (changed) {
            this.saveToStorage();
            this.notifyListeners();
            this.notifyUnreadCountListeners();
        }
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        this.notifications = [];
        this.saveToStorage();
        this.notifyListeners();
        this.notifyUnreadCountListeners();
    }

    /**
     * Remove a specific notification
     */
    remove(id: string): void {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            this.saveToStorage();
            this.notifyListeners();
            this.notifyUnreadCountListeners();
        }
    }

    /**
     * Handle invitation action (accept/decline)
     */
    async handleInvitationAction(invitationId: string, action: 'accept' | 'decline'): Promise<void> {
        const notification = this.notifications.find(
            n => n.type === 'invitation' && n.data?.invitationId === invitationId
        );

        if (!notification) {
            console.error('[NotificationManager] Invitation not found:', invitationId);
            return;
        }

        // Mark as pending
        notification.actionPending = true;
        this.notifyListeners();

        try {
            // Send action to backend
            webSocketService.send('lobby:invitation:response', {
                invitationId,
                action,
                lobbyId: notification.data?.lobbyId,
            });

            // Remove notification after action
            setTimeout(() => {
                this.remove(notification.id);
            }, 500);

        } catch (error) {
            console.error('[NotificationManager] Failed to handle invitation action:', error);
            notification.actionPending = false;
            this.notifyListeners();
        }
    }

    /**
     * Handle friend request action (accept/decline)
     */
    async handleFriendRequestAction(notificationId: string, action: 'accept' | 'decline'): Promise<void> {
        const notification = this.notifications.find(
            n => n.id === notificationId && n.type === 'friend_request'
        );

        if (!notification) {
            console.error('[NotificationManager] Friend request not found:', notificationId);
            return;
        }

        // Mark as pending
        notification.actionPending = true;
        this.notifyListeners();

        try {
            // Send action to backend
            webSocketService.send('friend:request:response', {
                userId: notification.data?.userId,
                action,
            });

            // Remove notification after action
            setTimeout(() => {
                this.remove(notification.id);
            }, 500);

        } catch (error) {
            console.error('[NotificationManager] Failed to handle friend request action:', error);
            notification.actionPending = false;
            this.notifyListeners();
        }
    }

    // ===== Event Listeners =====

    /**
     * Subscribe to notification changes
     */
    subscribe(listener: NotificationListener): () => void {
        this.listeners.add(listener);
        // Immediately notify with current state
        listener([...this.notifications]);
        // Return unsubscribe function
        return () => this.listeners.delete(listener);
    }

    /**
     * Subscribe to unread count changes
     */
    subscribeToUnreadCount(listener: UnreadCountListener): () => void {
        this.unreadCountListeners.add(listener);
        // Immediately notify with current count
        listener(this.getUnreadCount());
        // Return unsubscribe function
        return () => this.unreadCountListeners.delete(listener);
    }

    // ===== Private Methods =====

    /**
     * Add a new notification
     */
    private addNotification(notification: AppNotification): void {
        // Check for duplicates (same type, user, and recent timestamp)
        const isDuplicate = this.notifications.some(n => 
            n.type === notification.type &&
            n.data?.userId === notification.data?.userId &&
            Math.abs(n.timestamp - notification.timestamp) < 5000 // Within 5 seconds
        );

        if (isDuplicate) {
            console.log('[NotificationManager] Duplicate notification detected, skipping:', notification.id);
            return;
        }

        // Add to beginning of array (newest first)
        this.notifications.unshift(notification);

        // Limit to MAX_NOTIFICATIONS
        if (this.notifications.length > this.MAX_NOTIFICATIONS) {
            this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
        }

        // Remove expired invitations
        this.removeExpiredNotifications();

        this.saveToStorage();
        this.notifyListeners();
        this.notifyUnreadCountListeners();
    }

    /**
     * Remove expired notifications (invitations past their expiry time)
     */
    private removeExpiredNotifications(): void {
        const now = Date.now();
        const initialLength = this.notifications.length;

        this.notifications = this.notifications.filter(n => {
            if (n.type === 'invitation' && n.data?.expiresAt) {
                return n.data.expiresAt > now;
            }
            return true;
        });

        if (this.notifications.length !== initialLength) {
            console.log('[NotificationManager] Removed', initialLength - this.notifications.length, 'expired notifications');
        }
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        const notificationsCopy = [...this.notifications];
        this.listeners.forEach(listener => {
            try {
                listener(notificationsCopy);
            } catch (error) {
                console.error('[NotificationManager] Listener error:', error);
            }
        });
    }

    /**
     * Notify unread count listeners
     */
    private notifyUnreadCountListeners(): void {
        const count = this.getUnreadCount();
        this.unreadCountListeners.forEach(listener => {
            try {
                listener(count);
            } catch (error) {
                console.error('[NotificationManager] Unread count listener error:', error);
            }
        });
    }

    /**
     * Load notifications from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.notifications = parsed;
                    // Remove expired notifications on load
                    this.removeExpiredNotifications();
                    console.log('[NotificationManager] Loaded', this.notifications.length, 'notifications from storage');
                }
            }
        } catch (error) {
            console.error('[NotificationManager] Failed to load from storage:', error);
        }
    }

    /**
     * Save notifications to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
        } catch (error) {
            console.error('[NotificationManager] Failed to save to storage:', error);
        }
    }

    /**
     * Check if manager is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
