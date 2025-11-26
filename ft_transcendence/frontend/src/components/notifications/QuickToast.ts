/**
 * Quick Toast Component
 * 
 * Brief popup notification for high-priority events:
 * - Shows for 3 seconds then auto-dismisses
 * - Only for invitations and friend requests
 * - Positioned top-right on desktop, top-center on mobile
 * - Click to dismiss or open notification panel
 */

import { BaseComponent } from '../BaseComponent';
import { notificationManager, type AppNotification } from '../../services/notifications/NotificationManager';

interface ToastOptions {
    duration?: number; // Duration in ms (default 3000)
    onClick?: () => void; // Callback when toast is clicked
}

export class QuickToast extends BaseComponent {
    private unsubscribe: (() => void) | null = null;
    private activeToasts: Map<string, { timeout: number; element: HTMLElement }> = new Map();
    private readonly DEFAULT_DURATION = 3000;

    constructor() {
        super();
    }

    render(): string {
        return `
            <div id="toast-container" 
                 class="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none
                        md:w-96 w-full max-w-[calc(100vw-2rem)] px-4 md:px-0">
            </div>
        `;
    }

    protected afterMount(): void {
        // Subscribe to new notifications
        this.unsubscribe = notificationManager.subscribe(notifications => {
            // Find new unread high-priority notifications
            notifications
                .filter(n => !n.read && n.priority === 'high' && !this.activeToasts.has(n.id))
                .forEach(n => this.showToast(n));
        });
    }

    /**
     * Show a toast notification
     */
    private showToast(notification: AppNotification, options: ToastOptions = {}): void {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // Create toast element
        const toast = this.createToastElement(notification);
        
        // Add to container
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Setup click handler
        toast.addEventListener('click', () => {
            if (options.onClick) {
                options.onClick();
            }
            this.dismissToast(notification.id);
        });

        // Auto-dismiss after duration
        const duration = options.duration || this.DEFAULT_DURATION;
        const timeout = window.setTimeout(() => {
            this.dismissToast(notification.id);
        }, duration);

        // Track active toast
        this.activeToasts.set(notification.id, { timeout, element: toast });
    }

    /**
     * Dismiss a toast
     */
    private dismissToast(notificationId: string): void {
        const toast = this.activeToasts.get(notificationId);
        if (!toast) return;

        // Clear timeout
        clearTimeout(toast.timeout);

        // Animate out
        toast.element.classList.remove('translate-x-0', 'opacity-100');
        toast.element.classList.add('translate-x-full', 'opacity-0');

        // Remove from DOM after animation
        setTimeout(() => {
            toast.element.remove();
            this.activeToasts.delete(notificationId);
        }, 300);
    }

    /**
     * Create toast element
     */
    private createToastElement(notification: AppNotification): HTMLElement {
        const toast = document.createElement('div');
        toast.className = `
            toast-item
            bg-gradient-to-br from-gray-900 to-gray-800
            border-l-4 ${this.getBorderColor(notification.type)}
            rounded-lg shadow-2xl
            p-4 cursor-pointer
            transform transition-all duration-300 ease-out
            translate-x-full opacity-0
            pointer-events-auto
            hover:scale-105 hover:shadow-cyan-500/20
        `.trim().replace(/\s+/g, ' ');

        toast.setAttribute('data-notification-id', notification.id);

        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <!-- Icon -->
                <div class="flex-shrink-0 mt-1">
                    ${this.renderIcon(notification)}
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <p class="font-semibold text-white text-sm leading-tight">
                            ${this.escapeHtml(notification.title)}
                        </p>
                        <button class="toast-dismiss flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                                data-notification-id="${notification.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <p class="text-sm text-gray-300 mt-1 leading-tight">
                        ${this.escapeHtml(notification.message)}
                    </p>

                    <!-- Quick action hint -->
                    ${notification.actionable ? `
                        <p class="text-xs text-cyan-400 mt-2">
                            Click to view • ${this.getActionHint(notification.type)}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;

        // Add dismiss button handler
        const dismissBtn = toast.querySelector('.toast-dismiss');
        dismissBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissToast(notification.id);
        });

        return toast;
    }

    private renderIcon(notification: AppNotification): string {
        if (notification.data?.avatarUrl) {
            return `<img src="${notification.data.avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full ring-2 ring-cyan-500/50">`;
        }

        const icons = {
            invitation: `<div class="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
            </div>`,
            friend_request: `<div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            </div>`,
        };

        return icons[notification.type as keyof typeof icons] || '';
    }

    private getBorderColor(type: string): string {
        const colors = {
            invitation: 'border-purple-500',
            friend_request: 'border-green-500',
            chat: 'border-blue-500',
            game_started: 'border-cyan-500',
            achievement: 'border-yellow-500',
            system: 'border-gray-500',
        };
        return colors[type as keyof typeof colors] || 'border-gray-500';
    }

    private getActionHint(type: string): string {
        const hints = {
            invitation: 'Accept or decline',
            friend_request: 'Accept or decline',
        };
        return hints[type as keyof typeof hints] || '';
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Manually show a toast (for testing or special cases)
     */
    public show(notification: AppNotification, options: ToastOptions = {}): void {
        this.showToast(notification, options);
    }

    /**
     * Manually dismiss a toast
     */
    public dismiss(notificationId: string): void {
        this.dismissToast(notificationId);
    }

    /**
     * Dismiss all active toasts
     */
    public dismissAll(): void {
        this.activeToasts.forEach((_, id) => {
            this.dismissToast(id);
        });
    }

    /**
     * Cleanup when component is unmounted
     */
    unmount(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // Clear all active toasts
        this.dismissAll();
    }
}
