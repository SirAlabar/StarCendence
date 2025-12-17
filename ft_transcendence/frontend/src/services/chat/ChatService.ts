import { BaseService } from '../BaseService';
import { getChatApiUrl } from '../../types/api.types';
import { ChatMessage } from '../../types/chat.types';

export interface ChatHistoryResponse 
{
    friendId: string;
    messages: ChatMessage[];
}

export interface UnreadCountsResponse 
{
    unreadCounts: { [friendId: string]: number };
}

export interface SendMessageRequest 
{
    receiverId: string;
    message: string;
}

class ChatService extends BaseService 
{
    // GET /chat/history/:friendId - Get chat history with specific friend
    async getChatHistory(friendId: string): Promise<ChatMessage[]> 
    {
        this.requireAuth();

        if (!friendId) 
        {
            throw new Error('Friend ID is required');
        }

        const response = await this.fetchRequest(getChatApiUrl(`/history/${friendId}`), 
        {
            method: 'GET',
            headers: this.getHeaders()
        });

        const data = await this.handleResponse<ChatHistoryResponse>(response);
        
        // Convert timestamp strings to Date objects
        return data.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.createdAt),
            createdAt: new Date(msg.createdAt)
        }));
    }

    // POST /chat/send - Send a message
    async sendMessage(friendId: string, message: string): Promise<void> 
    {
        this.requireAuth();

        if (!friendId) 
        {
            throw new Error('Friend ID is required');
        }

        if (!message || message.trim().length === 0) 
        {
            throw new Error('Message cannot be empty');
        }

        if (message.length > 1000) 
        {
            throw new Error('Message must be 1000 characters or less');
        }

        const body: SendMessageRequest = {
            receiverId: friendId,
            message: message.trim()
        };

        const response = await this.fetchRequest(getChatApiUrl('/send'), { // ⬅️ CHANGE THIS
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });

        await this.handleResponse<void>(response);
    }

    // PATCH /chat/read/:friendId - Mark all messages from friend as read
    async markAsRead(friendId: string): Promise<void> 
    {
        this.requireAuth();

        if (!friendId) 
        {
            throw new Error('Friend ID is required');
        }

        const response = await this.fetchRequest(getChatApiUrl(`/read/${friendId}`), { // ⬅️ CHANGE THIS
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({})
        });

        await this.handleResponse<void>(response);
    }

    // GET /chat/unread-counts - Get unread message counts for all friends
    async getUnreadCounts(): Promise<Map<string, number>> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getChatApiUrl('/unread-counts'), { // ⬅️ CHANGE THIS
            method: 'GET',
            headers: this.getHeaders()
        });

        const data = await this.handleResponse<UnreadCountsResponse>(response);
        
        // Convert object to Map
        const unreadMap = new Map<string, number>();
        
        if (data.unreadCounts) 
        {
            Object.entries(data.unreadCounts).forEach(([friendId, count]) => 
            {
                unreadMap.set(friendId, count);
            });
        }

        return unreadMap;
    }
}

// Export singleton instance
export default new ChatService();