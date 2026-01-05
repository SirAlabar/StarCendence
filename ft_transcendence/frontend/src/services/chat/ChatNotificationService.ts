// Centralized notification badge management
import ChatService from './ChatService';
import { webSocketService } from '../websocket/WebSocketService';

class ChatNotificationService 
{
    private unreadMessages: Map<string, number> = new Map();
    private totalUnreadCallbacks: Array<(total: number) => void> = [];
    private friendUnreadCallbacks: Array<(friendId: string, count: number) => void> = [];
    private isInitialized: boolean = false;
    private wsMessageHandler: ((data: any) => void) | null = null;
    private wsLobbyInviteHandler: ((data: any) => void) | null = null;
    
    // Initialize and load unread counts from backend
    async initialize(): Promise<void> 
    {
        if (this.isInitialized) 
        {
            return;
        }
        
        try 
        {
            const unreadCounts = await ChatService.getUnreadCounts();
            this.unreadMessages = unreadCounts;
            
            this.isInitialized = true;
            
            // Setup WebSocket listener for real-time messages
            this.setupWebSocketListener();

            // Setup WebSocket listener for lobby invites
           // this.setupLobbyInviteListener();
            
            // Notify all callbacks with initial data
            this.notifyTotalUnreadCallbacks();
            
            // Notify per-friend callbacks
            this.unreadMessages.forEach((count, friendId) => 
            {
                if (count > 0) 
                {
                    this.notifyFriendUnreadCallbacks(friendId);
                }
            });
        } 
        catch (error) 
        {
            this.isInitialized = true; // Mark as initialized even on error
        }
    }
    
    // Setup WebSocket listener for incoming messages
    private setupWebSocketListener(): void 
    {
        this.wsMessageHandler = (data: any) => 
        {
            this.handleIncomingMessage(data);
        };
        
        webSocketService.on('chat:message', this.wsMessageHandler);
        
    }


    
    // Handle incoming WebSocket message
    private handleIncomingMessage(data: any): void 
    {
        try 
        {
            const { senderId } = data.payload || data;
            
            if (senderId) 
            {
                // Increment unread for this sender
                this.incrementUnread(senderId);
            }
        } 
        catch (error) 
        {
            // Silent fail
        }
    }
    
    // Increment unread count for a friend
    incrementUnread(friendId: string): void 
    {
        const currentCount = this.unreadMessages.get(friendId) || 0;
        const newCount = currentCount + 1;
        
        this.unreadMessages.set(friendId, newCount);
        
        // Notify callbacks
        this.notifyTotalUnreadCallbacks();
        this.notifyFriendUnreadCallbacks(friendId);
    }
    
    // Clear unread count for a friend
    clearUnread(friendId: string): void 
    {
        const hadUnread = this.unreadMessages.has(friendId) && this.unreadMessages.get(friendId)! > 0;
        
        this.unreadMessages.set(friendId, 0);
        
        if (hadUnread) 
        {
            // Notify callbacks
            this.notifyTotalUnreadCallbacks();
            this.notifyFriendUnreadCallbacks(friendId);
        }
    }
    
    // Get unread count for a specific friend
    getUnreadCount(friendId: string): number 
    {
        return this.unreadMessages.get(friendId) || 0;
    }
    
    // Get total unread count across all friends
    getTotalUnread(): number 
    {
        let total = 0;
        
        this.unreadMessages.forEach((count) => 
        {
            total += count;
        });
        
        return total;
    }
    
    // Subscribe to total unread count changes (for header badge)
    onTotalUnreadChange(callback: (total: number) => void): void 
    {
        this.totalUnreadCallbacks.push(callback);
        
        // Immediately call with current total
        callback(this.getTotalUnread());
    }
    
    // Subscribe to per-friend unread count changes (for friend list badges)
    onFriendUnreadChange(callback: (friendId: string, count: number) => void): void 
    {
        this.friendUnreadCallbacks.push(callback);
        
        // Immediately call with current counts for all friends
        this.unreadMessages.forEach((count, friendId) => 
        {
            callback(friendId, count);
        });
    }
    
    // Notify all total unread callbacks
    private notifyTotalUnreadCallbacks(): void 
    {
        const total = this.getTotalUnread();
        
        this.totalUnreadCallbacks.forEach(callback => 
        {
            try 
            {
                callback(total);
            }
            catch (error) 
            {
                // Silent fail
            }
        });
    }
    
    // Notify all friend unread callbacks for a specific friend
    private notifyFriendUnreadCallbacks(friendId: string): void 
    {
        const count = this.getUnreadCount(friendId);
        
        this.friendUnreadCallbacks.forEach(callback => 
        {
            try 
            {
                callback(friendId, count);
            }
            catch (error) 
            {
                // Silent fail
            }
        });
    }
    
    // Cleanup and reset
    dispose(): void 
    {
        // Remove WebSocket listener
        if (this.wsMessageHandler) 
        {
            webSocketService.off('chat:message', this.wsMessageHandler);
            this.wsMessageHandler = null;
        }

        // Remove lobby invite listener
        if (this.wsLobbyInviteHandler) {
            webSocketService.off('lobby:invite', this.wsLobbyInviteHandler);
            this.wsLobbyInviteHandler = null;
        }
        
        this.unreadMessages.clear();
        this.totalUnreadCallbacks = [];
        this.friendUnreadCallbacks = [];
        this.isInitialized = false;
    }
}

// Export singleton instance
export default new ChatNotificationService();