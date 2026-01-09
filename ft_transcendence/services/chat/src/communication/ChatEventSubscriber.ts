import { RedisClientType } from 'redis';
import { getRoomId } from '../chat/chatService';
import { saveMessage } from '../internal/internalRepository';


export interface payloadData
{
    targetUserId: string;
    message: string;
}

export interface ChatEventMessage 
{
    type: string;
    payload: payloadData;
    userId: string;
    username?: string;
    connectionId: string;
    timestamp: number;
}

export interface WebSocketBroadcastRequest 
{
    userIds?: string[];
    targetUserId?: string;
    message: 
    {
        type: string;
        payload: any;
        timestamp?: number;
    };
}

export class ChatEventSubscriber 
{
        private subscriber: RedisClientType;
        private publisher: RedisClientType;

        constructor(subscriber: RedisClientType, publisher: RedisClientType/*, chatManager : ChatManager*/) 
        {
            this.subscriber = subscriber;
            this.publisher = publisher;
            //this.chatManager = chatManager;
        }

        async initialize(): Promise<void> 
        {
            await this.subscriber.subscribe('chat:events', async (message : string) => 
            {
                await this.handleChatEvent(message);
            });
        }

    private async handleChatEvent(rawMessage: string): Promise<void>
    {
        try 
        {
            const event = JSON.parse(rawMessage) as ChatEventMessage;

            switch (event.type)
            {
                case 'chat:message':
                    await this.handleChatMessage(event);
                    break;


                default:
                    console.log("No handler for: ", event.type);
                    break;
            }
        } 
        catch (error) 
        {
        console.error('[ChatEventSubscriber] Error handling chat event:', error);
        }
    }

    private async handleChatMessage(event: ChatEventMessage): Promise<void> 
    {
        try 
        {
            // Save to database first
            const roomId = await getRoomId(event.userId, event.payload.targetUserId);
            const savedMessage = await saveMessage(event.userId, roomId, event.payload.message);
            
            // Broadcast with complete message info
            this.broadcastToUser(event.payload.targetUserId, {
                type: "chat:message",
                payload: {
                    messageId: savedMessage.id,
                    senderId: event.userId,
                    senderUsername: event.username || event.userId,
                    message: event.payload.message,
                    timestamp: savedMessage.createdAt.getTime(),
                    conversationId: savedMessage.conversationId,
                },
            });
        }
        catch (error) 
        {
            console.error('[ChatEventSubscriber] Error handling chat message:', error);
        }
    }

    //to send a message to a user you can send using this with the userID from the JWT, and the message is the payload with .stringify 
    private async broadcastToUser(userId: string, message: any): Promise<void>
    {
        const request: WebSocketBroadcastRequest = 
        {
        targetUserId: userId,
        message: 
        {   
            ...message,
            timestamp: message.timestamp || Date.now(),
        },
        };

        await this.publisher.publish('websocket:broadcast', JSON.stringify(request));
    }

    private async broadcastToUsers(userIds: string[], message: any): Promise<void>
    {
        const request: WebSocketBroadcastRequest = 
        {
            userIds,
            message: 
            {
                ...message,
                timestamp: message.timestamp || Date.now(),
            },
        };

        await this.publisher.publish('websocket:broadcast', JSON.stringify(request));
        console.log(`[ChatEventSubscriber] 📤 Broadcasted ${message.type} to ${userIds.length} user(s)`);
    }
}