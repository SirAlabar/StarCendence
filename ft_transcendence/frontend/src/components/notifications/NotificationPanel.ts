/**
 * Notification Panel Component
 * 
 * Dropdown panel displaying all notifications with:
 * - Scrollable list (max 400px height)
 * - Mark as read on item click
 * - Action buttons for invitations and friend requests
 * - "Mark all as read" and "Clear all" buttons
 * - Empty state when no notifications
 */

import { BaseComponent } from '../BaseComponent';
import { notificationManager, type AppNotification } from '../../services/notifications/NotificationManager';

export class NotificationPanel extends BaseComponent {
    private notifications: AppNotification[] = [];
    private unsubscribe: (() => void) | null = null;
    private isOpen = false;

    constructor() {
        super();
    }

    /**
     * Set panel open/closed state
     */
    setOpen(open: boolean): void {
        this.isOpen = open;
        this.updateDisplay();
    }

    /**
     * Toggle panel open/closed
     */
    toggle(): void {
        this.setOpen(!this.isOpen);
    }

    render(): string {
        return `
            <div id="notification-panel" 
                 class="fixed top-16 right-4 w-full max-w-md bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-50 hidden"
                 style="max-height: calc(100vh - 5rem);">
                
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 class="text-lg font-bold text-white">Notifications</h3>
                    <div class="flex gap-2">
                        <button id="mark-all-read-btn" 
                                class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                title="Mark all as read">
                            Mark all read
                        </button>
                        <button id="clear-all-btn" 
                                class="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                                title="Clear all">
                            Clear all
                        </button>
                    </div>
                </div>

                <!-- Notification List -->
                <div id="notification-list" 
                     class="overflow-y-auto"
                     style="max-height: 400px;">
                    ${this.renderNotificationList()}
                </div>
            </div>
        `;
    }

    private renderNotificationList(): string {
        if (this.notifications.length === 0) {
            return this.renderEmptyState();
        }

        return this.notifications.map(n => this.renderNotification(n)).join('');
    }

    private renderEmptyState(): string {
        return `
            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div class="text-gray-500 mb-2">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <p class="text-gray-400 text-sm">No notifications</p>
                <p class="text-gray-500 text-xs mt-1">You're all caught up!</p>
            </div>
        `;
    }

    private renderNotification(notification: AppNotification): string {
        const unreadClass = notification.read ? '' : 'bg-gray-800/50 border-l-4 border-cyan-500';
        const timeAgo = this.formatTimeAgo(notification.timestamp);

        return `
            <div class="notification-item p-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer ${unreadClass}"
                 data-notification-id="${notification.id}">
                
                <div class="flex items-start gap-3">
                    <!-- Icon/Avatar -->
                    <div class="flex-shrink-0">
                        ${this.renderNotificationIcon(notification)}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <p class="font-semibold text-white text-sm">${this.escapeHtml(notification.title)}</p>
                            <span class="text-xs text-gray-500 flex-shrink-0">${timeAgo}</span>
                        </div>
                        <p class="text-sm text-gray-300 mt-1">${this.escapeHtml(notification.message)}</p>

                        <!-- Action Buttons (for invitations and friend requests) -->
                        ${notification.actionable ? this.renderActionButtons(notification) : ''}
                    </div>
                </div>
            </div>
        `;
    }

    private renderNotificationIcon(notification: AppNotification): string {
        if (notification.data?.avatarUrl) {
            return `<img src="${notification.data.avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full">`;
        }

        // Default icons based on type
        const icons = {
            chat: `<svg class="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>`,
            invitation: `<svg class="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>`,
            friend_request: `<svg class="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>`,
            game_started: `<svg class="w-10 h-10 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>`,
            achievement: `<svg class="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>`,
            system: `<svg class="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>`,
        };

        return icons[notification.type] || icons.system;
    }

    private renderActionButtons(notification: AppNotification): string {
        if (!notification.actionable || notification.actionPending) {
            return notification.actionPending ? `
                <div class="mt-3 flex gap-2">
                    <div class="text-xs text-gray-400">Processing...</div>
                </div>
            ` : '';
        }

        return `
            <div class="mt-3 flex gap-2">
                <button class="notification-action-accept px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        data-notification-id="${notification.id}"
                        data-action="accept">
                    Accept
                </button>
                <button class="notification-action-decline px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                        data-notification-id="${notification.id}"
                        data-action="decline">
                    Decline
                </button>
            </div>
        `;
    }

    private formatTimeAgo(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    protected afterMount(): void {
        // Subscribe to notifications
        this.unsubscribe = notificationManager.subscribe(notifications => {
            this.notifications = notifications;
            this.updateList();
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Mark all as read
        const markAllBtn = document.getElementById('mark-all-read-btn');
        markAllBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationManager.markAllAsRead();
        });

        // Clear all
        const clearAllBtn = document.getElementById('clear-all-btn');
        clearAllBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Clear all notifications?')) {
                notificationManager.clearAll();
            }
        });

        // Notification item clicks (mark as read)
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const notificationItem = target.closest('.notification-item');
            if (notificationItem) {
                const id = notificationItem.getAttribute('data-notification-id');
                if (id) {
                    notificationManager.markAsRead(id);
                }
            }
        });

        // Action buttons (accept/decline)
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            if (target.classList.contains('notification-action-accept') || 
                target.classList.contains('notification-action-decline')) {
                e.stopPropagation();
                
                const id = target.getAttribute('data-notification-id');
                const action = target.getAttribute('data-action') as 'accept' | 'decline';
                
                if (id && action) {
                    this.handleAction(id, action);
                }
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.setOpen(false);
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notification-panel');
            const bellButton = document.getElementById('notification-bell-btn');
            const target = e.target as HTMLElement;

            if (this.isOpen && panel && !panel.contains(target) && !bellButton?.contains(target)) {
                this.setOpen(false);
            }
        });
    }

    private async handleAction(notificationId: string, action: 'accept' | 'decline'): Promise<void> {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        if (notification.type === 'invitation') {
            const invitationId = notification.data?.invitationId;
            if (invitationId) {
                await notificationManager.handleInvitationAction(invitationId, action);
            }
        } else if (notification.type === 'friend_request') {
            await notificationManager.handleFriendRequestAction(notificationId, action);
        }
    }

    private updateList(): void {
        const listElement = document.getElementById('notification-list');
        if (listElement) {
            listElement.innerHTML = this.renderNotificationList();
        }
    }

    private updateDisplay(): void {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            if (this.isOpen) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        }
    }

    /**
     * Cleanup when component is unmounted
     */
    unmount(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
