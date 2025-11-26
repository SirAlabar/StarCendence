/**
 * Example: Using Global WebSocket Handler in Components
 * 
 * This file shows practical examples of integrating the global WebSocket handler
 * into different parts of the application.
 */

import { globalWebSocketHandler, ChatMessage, FriendStatusUpdate, LobbyInvitation } from '@/services/websocket/GlobalWebSocketHandler';
import { BaseComponent } from '@/components/BaseComponent';

// ============================================================================
// EXAMPLE 1: Chat Manager Component
// ============================================================================

export class ChatManager extends BaseComponent {
    private unsubscribers: (() => void)[] = [];
    private unreadCount: Map<string, number> = new Map();

    mount(): void {
        // Register global chat handler
        const unsub = globalWebSocketHandler.registerChatHandler(
            (message) => this.handleChatMessage(message)
        );
        this.unsubscribers.push(unsub);
    }

    private handleChatMessage(message: ChatMessage): void {
        // Store message in local storage or state
        this.storeMessage(message);

        // Update unread count
        const contextId = message.lobbyId || message.channelId || 'global';
        const current = this.unreadCount.get(contextId) || 0;
        this.unreadCount.set(contextId, current + 1);

        // Update UI badge
        this.updateUnreadBadge(contextId);
    }

    private storeMessage(message: ChatMessage): void {
        // Store in IndexedDB, localStorage, or memory
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }

    private updateUnreadBadge(contextId: string): void {
        const badge = document.querySelector(`[data-context="${contextId}"] .unread-badge`);
        if (badge) {
            const count = this.unreadCount.get(contextId) || 0;
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.classList.remove('hidden');
        }
    }

    dispose(): void {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }

    render(): string {
        return '';
    }
}

// ============================================================================
// EXAMPLE 2: Friend List with Real-time Status
// ============================================================================

export class FriendListComponent extends BaseComponent {
    private unsubscribe: (() => void) | null = null;
    private friends: Map<string, FriendStatusUpdate> = new Map();

    mount(): void {
        // Register friend status handler
        this.unsubscribe = globalWebSocketHandler.registerFriendStatusHandler(
            (update) => this.handleFriendStatusUpdate(update)
        );

        this.renderFriendList();
    }

    private handleFriendStatusUpdate(update: FriendStatusUpdate): void {
        // Update friend status in memory
        this.friends.set(update.userId, update);

        // Update UI for this specific friend
        this.updateFriendUI(update.userId);
    }

    private updateFriendUI(userId: string): void {
        const friend = this.friends.get(userId);
        if (!friend) return;

        const element = document.querySelector(`[data-friend-id="${userId}"]`);
        if (!element) return;

        // Update status indicator
        const statusDot = element.querySelector('.status-indicator');
        if (statusDot) {
            statusDot.className = `status-indicator ${this.getStatusClass(friend.status)}`;
        }

        // Update status text
        const statusText = element.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = this.getStatusText(friend);
        }
    }

    private getStatusClass(status: string): string {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'in-game': return 'bg-yellow-500';
            case 'in-lobby': return 'bg-blue-500';
            case 'offline': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    }

    private getStatusText(friend: FriendStatusUpdate): string {
        switch (friend.status) {
            case 'in-game':
                return `Playing ${friend.gameType || 'game'}`;
            case 'in-lobby':
                return `In lobby`;
            case 'online':
                return 'Online';
            case 'offline':
                return 'Offline';
            default:
                return 'Unknown';
        }
    }

    private renderFriendList(): void {
        // Render friend list UI...
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    render(): string {
        return `
            <div class="friend-list">
                ${Array.from(this.friends.values()).map(friend => `
                    <div data-friend-id="${friend.userId}" class="friend-item">
                        <div class="status-indicator ${this.getStatusClass(friend.status)}"></div>
                        <span class="friend-name">${friend.username}</span>
                        <span class="status-text">${this.getStatusText(friend)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ============================================================================
// EXAMPLE 3: Invitation Modal
// ============================================================================

export class InvitationModal extends BaseComponent {
    private unsubscribe: (() => void) | null = null;
    private pendingInvitations: LobbyInvitation[] = [];

    mount(): void {
        // Register invitation handler
        this.unsubscribe = globalWebSocketHandler.registerInvitationHandler(
            (invitation) => this.handleInvitation(invitation)
        );
    }

    private handleInvitation(invitation: LobbyInvitation): void {
        console.log('New invitation:', invitation);

        // Add to pending list
        this.pendingInvitations.push(invitation);

        // Show modal
        this.showInvitationModal(invitation);

        // Auto-expire after timeout
        if (invitation.expiresAt) {
            const timeout = invitation.expiresAt - Date.now();
            if (timeout > 0) {
                setTimeout(() => {
                    this.removeInvitation(invitation.invitationId);
                }, timeout);
            }
        }
    }

    private showInvitationModal(invitation: LobbyInvitation): void {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md">
                <h2 class="text-xl font-bold mb-4">Game Invitation</h2>
                <div class="flex items-center gap-4 mb-4">
                    <img 
                        src="${invitation.fromAvatarUrl || '/assets/images/default-avatar.jpeg'}" 
                        class="w-12 h-12 rounded-full"
                    >
                    <div>
                        <p class="font-semibold">${invitation.fromUsername}</p>
                        <p class="text-sm text-gray-400">invited you to play ${invitation.gameType}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button 
                        class="btn-accept flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                        data-action="accept"
                    >
                        Accept
                    </button>
                    <button 
                        class="btn-decline flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                        data-action="decline"
                    >
                        Decline
                    </button>
                </div>
            </div>
        `;

        // Handle buttons
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const action = target.dataset.action;
            
            if (action === 'accept') {
                this.acceptInvitation(invitation);
                modal.remove();
            } else if (action === 'decline') {
                this.declineInvitation(invitation);
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    private acceptInvitation(invitation: LobbyInvitation): void {
        // Navigate to lobby
        const navigateTo = (window as any).navigateTo;
        if (navigateTo) {
            navigateTo(`/pong-lobby?id=${invitation.lobbyId}`);
        }

        // Remove from pending
        this.removeInvitation(invitation.invitationId);
    }

    private declineInvitation(invitation: LobbyInvitation): void {
        // Send decline message to server (if needed)
        // webSocketService.send('invitation:decline', { invitationId: invitation.invitationId });

        // Remove from pending
        this.removeInvitation(invitation.invitationId);
    }

    private removeInvitation(invitationId: string): void {
        this.pendingInvitations = this.pendingInvitations.filter(
            inv => inv.invitationId !== invitationId
        );
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    render(): string {
        return '';
    }
}

// ============================================================================
// EXAMPLE 4: Debug Logger (Generic Handler)
// ============================================================================

export class WebSocketDebugLogger {
    private unsubscribe: (() => void) | null = null;
    private logs: Array<{ type: string; payload: any; timestamp: number }> = [];

    start(): void {
        this.unsubscribe = globalWebSocketHandler.registerGenericHandler(
            (type, payload) => this.log(type, payload)
        );
        console.log('[WebSocketDebugLogger] Started');
    }

    private log(type: string, payload: any): void {
        const entry = { type, payload, timestamp: Date.now() };
        this.logs.push(entry);

        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs.shift();
        }

        // Console log with formatting
        console.log(
            `%c[WS] %c${type}`,
            'color: #00ff00; font-weight: bold',
            'color: #00ffff',
            payload
        );
    }

    getLogs(): typeof this.logs {
        return [...this.logs];
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    clearLogs(): void {
        this.logs = [];
    }

    stop(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        console.log('[WebSocketDebugLogger] Stopped');
    }
}

// ============================================================================
// EXAMPLE 5: Application-wide Integration
// ============================================================================

export class AppWebSocketIntegration {
    private chatManager: ChatManager | null = null;
    private friendList: FriendListComponent | null = null;
    private invitationModal: InvitationModal | null = null;
    private debugLogger: WebSocketDebugLogger | null = null;

    initialize(): void {
        // Initialize all global handlers
        this.chatManager = new ChatManager();
        this.chatManager.mount();

        this.friendList = new FriendListComponent();
        this.friendList.mount();

        this.invitationModal = new InvitationModal();
        this.invitationModal.mount();

        // Enable debug logging in development
        if (import.meta.env.DEV) {
            this.debugLogger = new WebSocketDebugLogger();
            this.debugLogger.start();
        }

        console.log('[AppWebSocketIntegration] Initialized');
    }

    cleanup(): void {
        this.chatManager?.dispose();
        this.friendList?.dispose();
        this.invitationModal?.dispose();
        this.debugLogger?.stop();

        this.chatManager = null;
        this.friendList = null;
        this.invitationModal = null;
        this.debugLogger = null;

        console.log('[AppWebSocketIntegration] Cleaned up');
    }
}
