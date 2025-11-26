/**
 * Global Chat Notifications Component
 * 
 * Shows toast notifications for chat messages received outside current context.
 * For example: chat messages from other lobbies, DMs, etc.
 * 
 * Usage:
 * - Initialize once in main app: `globalChatNotifications.initialize()`
 * - Will automatically show notifications for all chat messages
 * - Can be customized with filters and custom handlers
 */

import { globalWebSocketHandler, ChatMessage } from '@/services/websocket/GlobalWebSocketHandler';
import { BaseComponent } from '../BaseComponent';

interface NotificationOptions {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
    maxVisible?: number;
    playSound?: boolean;
    filterCurrentLobby?: boolean;
}

class GlobalChatNotifications extends BaseComponent {
    private unsubscribe: (() => void) | null = null;
    private options: NotificationOptions;
    private currentLobbyId: string | null = null;
    private notifications: HTMLElement[] = [];

    constructor(options: NotificationOptions = {}) {
        super();
        this.options = {
            position: options.position || 'bottom-right',
            duration: options.duration || 5000,
            maxVisible: options.maxVisible || 3,
            playSound: options.playSound || false,
            filterCurrentLobby: options.filterCurrentLobby !== false,
        };
    }

    /**
     * Initialize and start listening for chat messages
     */
    initialize(): void {
        if (this.unsubscribe) {
            return; // Already initialized
        }

        // Register global chat handler
        this.unsubscribe = globalWebSocketHandler.registerChatHandler(
            (message) => this.handleChatMessage(message)
        );

        // Create notification container
        this.createContainer();

        console.log('[GlobalChatNotifications] Initialized');
    }

    /**
     * Set current lobby ID to filter out messages from current context
     */
    setCurrentLobby(lobbyId: string | null): void {
        this.currentLobbyId = lobbyId;
    }

    /**
     * Handle incoming chat message
     */
    private handleChatMessage(message: ChatMessage): void {
        // Filter out messages from current lobby if enabled
        if (this.options.filterCurrentLobby && message.lobbyId === this.currentLobbyId) {
            return;
        }

        // Show notification
        this.showNotification(message);

        // Play sound if enabled
        if (this.options.playSound) {
            this.playNotificationSound();
        }
    }

    /**
     * Create notification container
     */
    private createContainer(): void {
        if (this.container) {
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'global-chat-notifications';
        this.container.className = `fixed z-[9999] flex flex-col gap-2 pointer-events-none ${this.getPositionClasses()}`;
        document.body.appendChild(this.container);
    }

    /**
     * Get CSS classes for container position
     */
    private getPositionClasses(): string {
        switch (this.options.position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
            default:
                return 'bottom-4 right-4';
        }
    }

    /**
     * Show a notification for a chat message
     */
    private showNotification(message: ChatMessage): void {
        if (!this.container) {
            return;
        }

        // Remove oldest notification if at max
        if (this.notifications.length >= this.options.maxVisible!) {
            const oldest = this.notifications.shift();
            if (oldest) {
                this.removeNotification(oldest);
            }
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'pointer-events-auto bg-gray-800 border border-cyan-500/30 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-right';
        
        const contextLabel = message.lobbyId 
            ? `Lobby #${message.lobbyId.substring(0, 8)}` 
            : message.channelId 
            ? `Channel` 
            : 'Direct Message';

        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <img 
                    src="${message.avatarUrl || '/assets/images/default-avatar.jpeg'}" 
                    alt="${message.username}"
                    class="w-10 h-10 rounded-full border border-cyan-500/30"
                >
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <span class="font-semibold text-white text-sm truncate">
                            ${this.escapeHtml(message.username)}
                        </span>
                        <span class="text-xs text-gray-400 whitespace-nowrap">
                            ${contextLabel}
                        </span>
                    </div>
                    <p class="text-sm text-gray-300 line-clamp-2">
                        ${this.escapeHtml(message.message)}
                    </p>
                </div>
                <button 
                    class="text-gray-400 hover:text-white transition-colors ml-2"
                    onclick="this.closest('.animate-slide-in-right').remove()"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        // Add click handler to navigate to source
        notification.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                this.handleNotificationClick(message);
            }
        });

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, this.options.duration);
    }

    /**
     * Remove a notification with animation
     */
    private removeNotification(notification: HTMLElement): void {
        notification.classList.add('animate-slide-out-right');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Handle notification click - navigate to source
     */
    private handleNotificationClick(message: ChatMessage): void {
        console.log('[GlobalChatNotifications] Clicked:', message);
        
        // TODO: Navigate to the lobby or channel where the message came from
        if (message.lobbyId) {
            // Navigate to lobby
            const navigateTo = (window as any).navigateTo;
            if (navigateTo) {
                navigateTo(`/pong-lobby?id=${message.lobbyId}`);
            }
        }
    }

    /**
     * Play notification sound
     */
    private playNotificationSound(): void {
        try {
            const audio = new Audio('/assets/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore errors (user hasn't interacted with page yet)
            });
        } catch (error) {
            // Ignore audio errors
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup and remove all notifications
     */
    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.notifications = [];
        console.log('[GlobalChatNotifications] Disposed');
    }

    render(): string {
        return ''; // This component doesn't render in the normal way
    }
}

// Export singleton instance for global use
export const globalChatNotifications = new GlobalChatNotifications({
    position: 'bottom-right',
    duration: 5000,
    maxVisible: 3,
    playSound: false,
    filterCurrentLobby: true,
});
