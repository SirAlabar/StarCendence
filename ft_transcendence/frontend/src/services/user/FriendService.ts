// FriendService.ts
import { BaseService } from '../BaseService';
import { getUserApiUrl } from '../../types/api.types';

export interface Friend 
{
    requestId: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
}

export interface FriendsResponse 
{
    userId: string;
    username: string;
    avatarUrl: string | null;
    friends: Friend[];
}

export interface FriendRequestsResponse 
{
    userId: string;
    username: string;
    avatarUrl: string | null;
    receivedRequests: Friend[];
}

export interface SentRequestsResponse 
{
    userId: string;
    username: string;
    avatarUrl: string | null;
    sentRequests: Friend[];
}

class FriendService extends BaseService 
{
    // GET /friends - Get user's friends list
    async getFriends(): Promise<FriendsResponse> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl('/friends'), {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse<FriendsResponse>(response);
    }

    // GET /friend-requests - Get received friend requests
    async getFriendRequests(): Promise<FriendRequestsResponse> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl('/friend-requests'), {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse<FriendRequestsResponse>(response);
    }

    // GET /friend-requests/sent - Get sent friend requests
    async getSentRequests(): Promise<SentRequestsResponse> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl('/friend-requests/sent'), {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse<SentRequestsResponse>(response);
    }

    // POST /friend-request - Send friend request
    async sendFriendRequest(username: string): Promise<void> 
    {
        this.requireAuth();

        if (!username || username.length < 3) 
        {
            throw new Error('Invalid username');
        }

        const response = await this.fetchRequest(getUserApiUrl('/friend-request'), {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username })
        });

        await this.handleResponse<void>(response);
    }

    // POST /friend-request/:id/accept - Accept friend request
    async acceptRequest(requestId: number): Promise<void> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl(`/friend-request/${requestId}/accept`), {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({})
        });

        await this.handleResponse<void>(response);
    }

    // POST /friend-request/:id/decline - Decline friend request
    async declineRequest(requestId: number): Promise<void> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl(`/friend-request/${requestId}/decline`), {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({})
        });

        await this.handleResponse<void>(response);
    }

    // DELETE /friend-request/:id - Cancel sent friend request
    async cancelRequest(requestId: number): Promise<void> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl(`/friend-request/${requestId}`), {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({})
        });

        await this.handleResponse<void>(response);
    }

    // DELETE /friends/:id - Remove friend
    async unfriend(friendId: string): Promise<void> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl(`/friends/${friendId}`), {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({})
        });

        await this.handleResponse<void>(response);
    }
}

// Export singleton instance
export default new FriendService();