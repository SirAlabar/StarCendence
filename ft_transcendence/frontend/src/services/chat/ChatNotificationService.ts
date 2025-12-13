// ChatNotificationService.ts - Centralized notification badge management
import ChatService from './ChatService';

class ChatNotificationService 
{
    private unreadMessages: Map<string, number> = new Map();
    private totalUnreadCallbacks: Array<(total: number) => void> = [];
    private friendUnreadCallbacks: Array<(friendId: string, count: number) => void> = [];
    private isInitialized: boolean = false;
    
    constructor() 
    {
        console.log('[ChatNotificationService] 🔧 Initialized');
    }
    
    // Initialize and load unread counts from backend
    async initialize(): Promise<void> 
    {
        if (this.isInitialized) 
        {
            console.log('[ChatNotificationService] ⚠️ Already initialized');
            return;
        }
        
        console.log('[ChatNotificationService] 🚀 Loading initial unread counts from backend...');
        
        try 
        {
            const unreadCounts = await ChatService.getUnreadCounts();
            this.unreadMessages = unreadCounts;
            
            console.log('[ChatNotificationService] ✅ Loaded unread counts:', 
                Array.from(this.unreadMessages.entries()).map(([id, count]) => ({ friendId: id, count }))
            );
            
            this.isInitialized = true;
            
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
            console.error('[ChatNotificationService] ❌ Failed to load unread counts:', error);
            this.isInitialized = true; // Mark as initialized even on error
        }
    }
    
    // Increment unread count for a friend
    incrementUnread(friendId: string): void 
    {
        console.log('[ChatNotificationService] 📈 Incrementing unread for friend:', friendId);
        
        const currentCount = this.unreadMessages.get(friendId) || 0;
        const newCount = currentCount + 1;
        
        this.unreadMessages.set(friendId, newCount);
        
        console.log('[ChatNotificationService] 💬 New unread count for', friendId, ':', newCount);
        
        // Notify callbacks
        this.notifyTotalUnreadCallbacks();
        this.notifyFriendUnreadCallbacks(friendId);
    }
    
    // Clear unread count for a friend
    clearUnread(friendId: string): void 
    {
        console.log('[ChatNotificationService] 🧹 Clearing unread for friend:', friendId);
        
        const hadUnread = this.unreadMessages.has(friendId) && this.unreadMessages.get(friendId)! > 0;
        
        this.unreadMessages.set(friendId, 0);
        
        if (hadUnread) 
        {
            console.log('[ChatNotificationService] ✅ Cleared unread for:', friendId);
            
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
        console.log('[ChatNotificationService] 👂 Registered total unread callback');
        this.totalUnreadCallbacks.push(callback);
        
        // Immediately call with current total
        callback(this.getTotalUnread());
    }
    
    // Subscribe to per-friend unread count changes (for friend list badges)
    onFriendUnreadChange(callback: (friendId: string, count: number) => void): void 
    {
        console.log('[ChatNotificationService] 👂 Registered friend unread callback');
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
        
        console.log('[ChatNotificationService] 🔔 Notifying total unread callbacks, total:', total);
        
        this.totalUnreadCallbacks.forEach(callback => 
        {
            try 
            {
                callback(total);
            }
            catch (error) 
            {
                console.error('[ChatNotificationService] ❌ Error in total unread callback:', error);
            }
        });
    }
    
    // Notify all friend unread callbacks for a specific friend
    private notifyFriendUnreadCallbacks(friendId: string): void 
    {
        const count = this.getUnreadCount(friendId);
        
        console.log('[ChatNotificationService] 🔔 Notifying friend unread callbacks for', friendId, 'count:', count);
        
        this.friendUnreadCallbacks.forEach(callback => 
        {
            try 
            {
                callback(friendId, count);
            }
            catch (error) 
            {
                console.error('[ChatNotificationService] ❌ Error in friend unread callback:', error);
            }
        });
    }
    
    // Cleanup and reset
    dispose(): void 
    {
        console.log('[ChatNotificationService] 🧹 Disposing');
        this.unreadMessages.clear();
        this.totalUnreadCallbacks = [];
        this.friendUnreadCallbacks = [];
        this.isInitialized = false;
    }
}

// Export singleton instance
export default new ChatNotificationService();