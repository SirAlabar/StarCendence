/*
 * Notifications Component
 */

import { BaseComponent } from '../BaseComponent';
import { webSocketService } from '@/services/websocket/WebSocketService';

interface NotificationData 
{
    id: string;
    title: string;
    message: string;
    type: 'chat' | 'invitation' | 'friend_request' | 'system';
    avatarUrl?: string;
    userId?: string;
    username?: string;
}

class Notifications extends BaseComponent 
{
    private notifications: HTMLElement[] = [];
    private shownIds: Set<string> = new Set();
    private readonly MAX_VISIBLE = 3;
    private readonly DURATION = 5000;

    constructor() 
    {
        super();
    }

    /**
     * Initialize and start listening
     */
    initialize(): void 
    {
        console.log('[Notifications] 🚀 Initializing...');
        
        // Create container
        this.createContainer();

        // Listen for chat messages
        webSocketService.on('chat:message', (data: any) => 
        {
            this.handleChatMessage(data);
        });

        // Listen for friend requests
        webSocketService.on('friend:request', (data: any) => 
        {
            this.handleFriendRequest(data);
        });

        // Listen for game invitations
        webSocketService.on('lobby:invitation', (data: any) => 
        {
            this.handleGameInvitation(data);
        });

        console.log('[Notifications] ✅ Initialized');
    }

    /**
     * Create notification container
     */
    private createContainer(): void 
    {
        if (this.container) 
        {
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(this.container);
    }

    /**
     * Handle incoming chat message
     */
    private handleChatMessage(data: any): void 
    {
        const payload = data.payload || data;
        
        const username = payload.senderUsername || payload.username || 'Unknown';
        const firstName = username.split(/[_\s]/)[0];
        
        const notification: NotificationData = {
            id: `chat_${payload.senderId}_${Date.now()}`,
            title: firstName,
            message: payload.message || payload.content,
            type: 'chat',
            avatarUrl: payload.senderAvatarUrl || payload.avatarUrl,
            userId: payload.senderId,
            username: username
        };

        this.show(notification);
    }

    /**
     * Handle friend request
     */
    private handleFriendRequest(data: any): void 
    {
        const payload = data.payload || data;
        
        const notification: NotificationData = {
            id: `friend_${payload.userId}_${Date.now()}`,
            title: 'Friend Request',
            message: `${payload.username} wants to be your friend`,
            type: 'friend_request',
            avatarUrl: payload.avatarUrl,
            userId: payload.userId,
            username: payload.username
        };

        this.show(notification);
    }

    /**
     * Handle game invitation
     */
    private handleGameInvitation(data: any): void 
    {
        const payload = data.payload || data;
        
        const notification: NotificationData = {
            id: `invite_${payload.fromUserId}_${Date.now()}`,
            title: 'Game Invitation',
            message: `${payload.fromUsername} invited you to play ${payload.gameType}`,
            type: 'invitation',
            avatarUrl: payload.fromAvatarUrl,
            userId: payload.fromUserId,
            username: payload.fromUsername
        };

        this.show(notification);
    }

    /**
     * Show a notification
     */
    private show(notification: NotificationData): void 
    {
        if (!this.container) 
        {
            return;
        }

        // Don't show duplicates
        if (this.shownIds.has(notification.id)) 
        {
            return;
        }

        this.shownIds.add(notification.id);

        // Remove oldest if at max
        if (this.notifications.length >= this.MAX_VISIBLE) 
        {
            const oldest = this.notifications.shift();
            if (oldest) 
            {
                this.remove(oldest);
            }
        }

        // Create notification element
        const el = document.createElement('div');
        el.className = 'pointer-events-auto bg-gray-800 border border-cyan-500/30 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-right';
        el.setAttribute('data-notification-id', notification.id);
        
        el.innerHTML = `
            <div class="flex items-start gap-3">
                ${this.renderIcon(notification)}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <span class="font-semibold text-white text-sm truncate">
                            ${this.escape(notification.title)}
                        </span>
                        <span class="text-xs text-cyan-400">
                            ${this.getTypeLabel(notification.type)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-300 line-clamp-2">
                        ${this.escape(notification.message)}
                    </p>
                </div>
                <button class="text-gray-400 hover:text-white transition-colors ml-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        // Add click handler for close button
        const closeBtn = el.querySelector('button');
        closeBtn?.addEventListener('click', (e) => 
        {
            e.stopPropagation();
            this.remove(el);
        });

        // Add click handler for whole notification
        el.addEventListener('click', () => 
        {
            this.handleClick(notification);
        });

        // Add to container
        this.container.appendChild(el);
        this.notifications.push(el);

        // Auto-remove after duration
        setTimeout(() => 
        {
            this.remove(el);
        }, this.DURATION);
    }

    /**
     * Remove notification
     */
    private remove(el: HTMLElement): void 
    {
        el.classList.add('animate-slide-out-right');
        
        setTimeout(() => 
        {
            if (el.parentNode) 
            {
                el.remove();
            }
            
            const index = this.notifications.indexOf(el);
            if (index > -1) 
            {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Handle notification click
     */
    private handleClick(notification: NotificationData): void 
    {
        console.log('[Notifications] 👆 Clicked:', notification);
        
        // Navigate based on type
        if (notification.type === 'chat' && notification.userId) 
        {
            // Open chat with this friend
            const event = new CustomEvent('open-chat', { 
                detail: { friendId: notification.userId } 
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Render icon
     */
    private renderIcon(notification: NotificationData): string 
    {
        if (notification.avatarUrl) 
        {
            return `
                <img 
                    src="${notification.avatarUrl}" 
                    alt="${notification.username || 'User'}"
                    class="w-10 h-10 rounded-full border border-cyan-500/30"
                >
            `;
        }

        const icons: Record<string, string> = {
            chat: `
                <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                </div>
            `,
            invitation: `
                <div class="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                    <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91z"/>
                    </svg>
                </div>
            `,
            friend_request: `
                <div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                </div>
            `,
        };

        return icons[notification.type] || icons.chat;
    }

    /**
     * Get type label
     */
    private getTypeLabel(type: string): string 
    {
        const labels: Record<string, string> = {
            chat: 'Message',
            invitation: 'Invite',
            friend_request: 'Friend',
            system: 'System',
        };
        return labels[type] || 'Notification';
    }

    /**
     * Escape HTML
     */
    private escape(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup
     */
    dispose(): void 
    {
        if (this.container) 
        {
            this.container.remove();
            this.container = null;
        }

        this.notifications = [];
        this.shownIds.clear();
        
        console.log('[Notifications] 🧹 Disposed');
    }

    render(): string 
    {
        return '';
    }
}

// Export singleton instance
export const notifications = new Notifications();