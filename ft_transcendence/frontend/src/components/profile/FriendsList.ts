//  Friends management
import { BaseComponent } from '../BaseComponent';
import FriendService from '../../services/user/FriendService';
import { getBaseUrl } from '@/types/api.types';
import { Modal } from '@/components/common/Modal';
import ChatNotificationService from '../../services/chat/ChatNotificationService';
import { ChatModal } from './ChatWindow';

interface Friend 
{
    id: string;
    username: string;
    status: string;
    avatarUrl?: string;
}

interface FriendRequest 
{
    requestId: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
}

interface FriendsListProps 
{
    friends: Friend[];
    friendRequests: FriendRequest[];
    onRequestHandled: () => void;
}

export class FriendsList extends BaseComponent 
{
    private props: FriendsListProps;
    private friendUnreadCounts: Map<string, number> = new Map();

    constructor(props: FriendsListProps) 
    {
        super();
        this.props = props;
    }

    render(): string 
    {
        return `
            <div class="bg-gray-800/20 backdrop-blur-md rounded-lg p-4 sm:p-6 md:p-8 border border-gray-700/50 flex flex-col h-full">
                <h3 class="text-xl sm:text-2xl font-bold text-cyan-400 mb-4 sm:mb-6 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                    FRIENDS
                </h3>
                
                <!-- Friend Requests Section -->
                ${this.props.friendRequests.length > 0 ? this.renderFriendRequests() : ''}
                
                <!-- Friends List -->
                ${this.props.friends.length > 0 
                    ? `<div class="space-y-3 sm:space-y-4 mb-4 sm:mb-6 flex-1 overflow-y-auto">
                        ${this.props.friends.map(friend => this.renderFriendItem(friend)).join('')}
                    </div>`
                    : '<div class="flex-1"></div>'
                }
                
                <button id="add-friend-btn" class="neon-border w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-bold text-cyan-400 tracking-wide flex items-center justify-center gap-2 sm:gap-3 mt-auto text-sm sm:text-base">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                    ADD NEW FRIEND
                </button>
            </div>
            
            <style>
                .neon-border {
                    border: 2px solid #00ffff;
                    box-shadow:
                        0 0 10px rgba(0, 255, 255, 0.5),
                        0 0 20px rgba(0, 255, 255, 0.3),
                        inset 0 0 10px rgba(0, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border:hover {
                    box-shadow:
                        0 0 15px rgba(0, 255, 255, 0.8),
                        0 0 30px rgba(0, 255, 255, 0.5),
                        inset 0 0 15px rgba(0, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
                
                .neon-border-small {
                    border: 2px solid #00ffff;
                    box-shadow:
                        0 0 5px rgba(0, 255, 255, 0.4),
                        0 0 10px rgba(0, 255, 255, 0.2),
                        inset 0 0 5px rgba(0, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }

                .neon-border-small:hover {
                    box-shadow:
                        0 0 10px rgba(0, 255, 255, 0.6),
                        0 0 20px rgba(0, 255, 255, 0.4),
                        inset 0 0 10px rgba(0, 255, 255, 0.2);
                }
                
                .neon-border-green {
                    border: 2px solid #00ff88;
                    box-shadow:
                        0 0 5px rgba(0, 255, 136, 0.4),
                        0 0 10px rgba(0, 255, 136, 0.2),
                        inset 0 0 5px rgba(0, 255, 136, 0.1);
                    transition: all 0.3s ease;
                }

                .neon-border-green:hover {
                    box-shadow:
                        0 0 10px rgba(0, 255, 136, 0.6),
                        0 0 20px rgba(0, 255, 136, 0.4),
                        inset 0 0 10px rgba(0, 255, 136, 0.2);
                }
                
                .neon-border-red {
                    border: 2px solid #ff0044;
                    box-shadow:
                        0 0 5px rgba(255, 0, 68, 0.4),
                        0 0 10px rgba(255, 0, 68, 0.2),
                        inset 0 0 5px rgba(255, 0, 68, 0.1);
                    transition: all 0.3s ease;
                }

                .neon-border-red:hover {
                    box-shadow:
                        0 0 10px rgba(255, 0, 68, 0.6),
                        0 0 20px rgba(255, 0, 68, 0.4),
                        inset 0 0 10px rgba(255, 0, 68, 0.2);
                }
                
                .chat-button-badge {
                    position: absolute;
                    top: -6px;
                    left: -6px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    background: #ff0044;
                    color: white;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    box-shadow: 0 0 8px rgba(255, 0, 68, 0.8);
                    z-index: 10;
                }
            </style>
        `;
    }

    private renderFriendRequests(): string 
    {
        return `
            <div class="mb-4 sm:mb-6 p-3 sm:p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <h4 class="text-base sm:text-lg font-bold text-cyan-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span class="text-sm sm:text-base">FRIEND REQUESTS (${this.props.friendRequests.length})</span>
                </h4>
                <div class="space-y-2 sm:space-y-3">
                    ${this.props.friendRequests.map(request => this.renderRequestItem(request)).join('')}
                </div>
            </div>
        `;
    }

    private renderRequestItem(request: FriendRequest): string 
    {
        const avatarUrl = request.avatarUrl ? `${getBaseUrl()}${request.avatarUrl}` : null;

        const avatarContent = avatarUrl
            ? `<img src="${avatarUrl}" alt="${request.username}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover">`
            : `<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-base sm:text-lg font-bold text-white">
                ${request.username.charAt(0).toUpperCase()}
            </div>`;

        return `
            <div class="flex items-center justify-between p-2 sm:p-3 bg-gray-900/40 rounded-lg gap-2">
                <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    ${avatarContent}
                    <div class="min-w-0 flex-1">
                        <h5 class="text-sm sm:text-base font-bold text-cyan-400 truncate">${this.escapeHtml(request.username)}</h5>
                        <p class="text-xs text-gray-400">wants to be your friend</p>
                    </div>
                </div>
                <div class="flex gap-1 sm:gap-2 flex-shrink-0">
                    <button class="neon-border-green px-2 sm:px-3 py-1 rounded-lg font-bold text-green-400 text-xs" data-accept-request="${request.requestId}">
                        ✓
                    </button>
                    <button class="neon-border-red px-2 sm:px-3 py-1 rounded-lg font-bold text-red-400 text-xs" data-decline-request="${request.requestId}">
                        ✗
                    </button>
                </div>
            </div>
        `;
    }

    private renderFriendItem(friend: Friend): string 
    {
        const statusInfo = this.getStatusInfo(friend.status);
        const avatarUrl = friend.avatarUrl ? `${getBaseUrl()}${friend.avatarUrl}` : null;
        
        // Get unread count for this friend
        const unreadCount = this.friendUnreadCounts.get(friend.id) || 0;

        const avatarContent = avatarUrl
            ? `<img src="${avatarUrl}" alt="${friend.username}" class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover">`
            : `<div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg sm:text-xl font-bold text-white">
                ${friend.username.charAt(0).toUpperCase()}
            </div>`;

        return `
            <div class="flex items-center justify-between p-3 sm:p-4 md:p-5 bg-gray-900/30 rounded-lg border border-gray-700/30 hover:border-cyan-500/50 transition-all gap-2 sm:gap-3">
                <div class="flex items-center gap-2 sm:gap-3 md:gap-4 cursor-pointer min-w-0 flex-1" data-friend-username="${this.escapeHtml(friend.username)}">
                    <div class="relative flex-shrink-0">
                        ${avatarContent}
                        <span class="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${statusInfo.color} rounded-full border-2 border-gray-900"></span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h4 class="text-base sm:text-lg font-bold text-cyan-400 truncate">${this.escapeHtml(friend.username)}</h4>
                        <p class="text-xs sm:text-sm text-gray-400">${statusInfo.text}</p>
                    </div>
                </div>
                <button class="neon-border-small px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-cyan-400 text-xs sm:text-sm flex-shrink-0 relative" data-friend-id="${friend.id}" data-friend-username="${this.escapeHtml(friend.username)}" data-friend-avatar="${friend.avatarUrl || ''}">
                    CHAT
                    ${unreadCount > 0 ? `<span class="chat-button-badge" data-badge-friend-id="${friend.id}">${unreadCount}</span>` : ''}
                </button>
            </div>
        `;
    }

    private getStatusInfo(status: Friend['status']): { color: string; text: string } 
    {
        switch (status) 
        {
            case 'ONLINE':
                return { color: 'bg-green-500', text: 'Online' };
            case 'IN_GAME':
                return { color: 'bg-blue-500', text: 'In Match' };
            case 'OFFLINE':
            default:
                return { color: 'bg-gray-500', text: 'Offline' };
        }
    }

    protected afterMount(): void 
    {
        this.setupEventListeners();
        this.subscribeToNotifications();
        this.loadInitialUnreadCounts();
    }
    
    private subscribeToNotifications(): void 
    {
        console.log('[FriendsList] 👂 Subscribing to friend unread notifications');
        
        ChatNotificationService.onFriendUnreadChange((friendId: string, count: number) => 
        {
            console.log('[FriendsList] 🔔 Friend unread count changed:', friendId, count);
            this.friendUnreadCounts.set(friendId, count);
            this.updateFriendBadge(friendId, count);
        });
    }

    private loadInitialUnreadCounts(): void 
    {
        console.log('[FriendsList] 📊 Loading initial unread counts');
        
        this.props.friends.forEach(friend => 
        {
            const count = ChatNotificationService.getUnreadCount(friend.id);
            console.log('[FriendsList] Friend:', friend.username, 'Unread:', count);
            
            if (count > 0) 
            {
                this.friendUnreadCounts.set(friend.id, count);
            }
        });
        
        // Force update all badges after loading
        this.props.friends.forEach(friend => 
        {
            const count = this.friendUnreadCounts.get(friend.id) || 0;
            this.updateFriendBadge(friend.id, count);
        });
    }
    
    private updateFriendBadge(friendId: string, count: number): void 
    {
        const chatButton = document.querySelector(`button[data-friend-id="${friendId}"]`);
        if (!chatButton) 
        {
            return;
        }
        
        const existingBadge = chatButton.querySelector(`[data-badge-friend-id="${friendId}"]`);
        
        if (count > 0) 
        {
            if (existingBadge) 
            {
                // Update existing badge
                existingBadge.textContent = count.toString();
            }
            else 
            {
                // Create new badge
                const badge = document.createElement('span');
                badge.className = 'chat-button-badge';
                badge.setAttribute('data-badge-friend-id', friendId);
                badge.textContent = count.toString();
                chatButton.appendChild(badge);
            }
        }
        else 
        {
            // Remove badge if count is 0
            if (existingBadge) 
            {
                existingBadge.remove();
            }
        }
    }

    private setupEventListeners(): void 
    {
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) 
        {
            addFriendBtn.addEventListener('click', () => 
            {
                this.handleAddFriend();
            });
        }

        // Accept friend request buttons
        const acceptButtons = document.querySelectorAll('[data-accept-request]');
        acceptButtons.forEach(button => 
        {
            button.addEventListener('click', async (e) => 
            {
                const requestId = (e.target as HTMLElement).getAttribute('data-accept-request');
                if (requestId) 
                {
                    await this.handleAcceptRequest(parseInt(requestId));
                }
            });
        });

        // Decline friend request buttons
        const declineButtons = document.querySelectorAll('[data-decline-request]');
        declineButtons.forEach(button => 
        {
            button.addEventListener('click', async (e) => 
            {
                const requestId = (e.target as HTMLElement).getAttribute('data-decline-request');
                if (requestId) 
                {
                    await this.handleDeclineRequest(parseInt(requestId));
                }
            });
        });

        const chatButtons = document.querySelectorAll('[data-friend-id]');
        chatButtons.forEach(button => 
        {
            button.addEventListener('click', (e) => 
            {
                const target = e.currentTarget as HTMLElement;
                const friendId = target.getAttribute('data-friend-id');
                const friendUsername = target.getAttribute('data-friend-username');
                const friendAvatar = target.getAttribute('data-friend-avatar');
                
                if (friendId && friendUsername) 
                {
                    this.handleChatClick(friendId, friendUsername, friendAvatar);
                }
            });
        });

        // Add click handler for friend profile viewing
        const friendItems = document.querySelectorAll('[data-friend-username]');
        friendItems.forEach(item => 
        {
            // Only add to the div, not the button
            if (item.tagName !== 'BUTTON') 
            {
                item.addEventListener('click', (e) => 
                {
                    const username = (e.currentTarget as HTMLElement).getAttribute('data-friend-username');
                    if (username) 
                    {
                        this.handleViewProfile(username);
                    }
                });
            }
        });
    }

    private handleAddFriend(): void 
    {
        // Trigger event to parent to open search modal
        const event = new CustomEvent('openSearchModal');
        window.dispatchEvent(event);
    }

    private async handleAcceptRequest(requestId: number): Promise<void> 
    {
        try 
        {
            await FriendService.acceptRequest(requestId);
            this.props.onRequestHandled();
        } 
        catch (err) 
        {
            console.error('Failed to accept friend request:', err);
            await Modal.alert('Error', 'Failed to accept friend request');
        }
    }

    private async handleDeclineRequest(requestId: number): Promise<void> 
    {
        try 
        {
            await FriendService.declineRequest(requestId);
            this.props.onRequestHandled();
        } 
        catch (err) 
        {
            console.error('Failed to decline friend request:', err);
            await Modal.alert('Error', 'Failed to decline friend request');
        }
    }

    private handleChatClick(friendId: string, friendUsername: string, friendAvatar: string | null): void 
    {
        console.log('[FriendsList] 💬 Opening chat with:', friendUsername, 'ID: ', friendId);
        this.openChatModal(friendId, friendUsername, friendAvatar);
    }
    
    private openChatModal(friendId: string, friendUsername: string, friendAvatar: string | null): void 
    {
        // Check if modal already exists
        const existingModal = document.getElementById('chat-modal-container');
        if (existingModal) 
        {
            console.log('[FriendsList] ⚠️ Chat modal already open');
            return;
        }
        
        const chatModal = new ChatModal({
            friendId,
            friendUsername,
            friendAvatar,
            onClose: () => 
            {
                console.log('[FriendsList] 🚪 Closing chat modal');
                const container = document.getElementById('chat-modal-container');
                if (container) 
                {
                    container.remove();
                }
            }
        });
        
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-modal-container';
        document.body.appendChild(chatContainer);
        chatModal.mount('#chat-modal-container');
        
        // Clear unread count for this friend
        ChatNotificationService.clearUnread(friendId);
    }

    private handleViewProfile(username: string): void 
    {
        (window as any).navigateTo(`/user/${username}`);
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}