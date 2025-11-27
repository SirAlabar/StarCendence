import { webSocketService } from '../websocket/WebSocketService';

export interface FriendWithStatus 
{
    userId: string;
    username: string;
    avatarUrl: string;
    status: string;
}

class OnlineFriendsService 
{
    private onlineFriends: Map<string, FriendWithStatus> = new Map();
    private statusChangeCallbacks: Array<(friends: FriendWithStatus[]) => void> = [];
    private isSubscribed: boolean = false;
    
    constructor() 
    {
    }
    
    async initialize(): Promise<void> 
    {
        if (this.isSubscribed) 
        {
            return;
        }
        
        if (!webSocketService.isConnected()) 
        {
            await webSocketService.connect();
        }
        
        webSocketService.subscribeFriendsStatus((userId: string, status: string) => 
        {
            this.handleFriendStatusChange(userId, status);
        });
        
        this.isSubscribed = true;
    }
    
    private handleFriendStatusChange(userId: string, status: string): void 
    {
        
        const friend = this.onlineFriends.get(userId);
        
        if (status === 'online') 
        {
            if (friend) 
            {
                friend.status = 'online';
            }
        }
        else 
        {
            if (friend) 
            {
                this.onlineFriends.delete(userId);
            }
        }
        
        this.notifyStatusChangeCallbacks();
    }
    
    addFriend(friend: FriendWithStatus): void 
    {
        if (friend.status === 'online') 
        {
            this.onlineFriends.set(friend.userId, friend);
            this.notifyStatusChangeCallbacks();
        }
    }
    
    removeFriend(userId: string): void 
    {
        this.onlineFriends.delete(userId);
        this.notifyStatusChangeCallbacks();
    }
    
    getOnlineFriends(): FriendWithStatus[] 
    {
        return Array.from(this.onlineFriends.values());
    }
    
    onStatusChange(callback: (friends: FriendWithStatus[]) => void): void 
    {
        this.statusChangeCallbacks.push(callback);
    }
    
    private notifyStatusChangeCallbacks(): void 
    {
        const friends = this.getOnlineFriends();
        this.statusChangeCallbacks.forEach(callback => 
        {
            try 
            {
                callback(friends);
            }
            catch (error) 
            {
                console.error('[OnlineFriendsService] Error in callback:', error);
            }
        });
    }
    
    dispose(): void 
    {
        webSocketService.unsubscribeFriendsStatus();
        this.onlineFriends.clear();
        this.statusChangeCallbacks = [];
        this.isSubscribed = false;
    }
}

export default new OnlineFriendsService();