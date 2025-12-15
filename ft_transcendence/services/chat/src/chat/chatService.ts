import * as chatRepository from './chatRepository';
import { HttpError } from '../utils/HttpError';
import { getRedisClient } from '../communication/RedisPublisher';

// Generate a unique room ID for a conversation between two users
export async function getRoomId(userId1: string, userId2: string) 
{
  return [userId1, userId2].sort().join('_');
}

// Internal: Create a new conversation between two users if it doesn't already exist
async function createConversation(userId: string, targetUserId: string) 
{
  const roomId = await getRoomId(userId, targetUserId);

  const existingConversation = await chatRepository.getConversationByRoomId(roomId);
  if (existingConversation) 
  {
    return existingConversation;
  }

  return chatRepository.createConversation(userId, targetUserId);
}

// Get chat history
export async function getChatHistory(userId: string, friendId: string) 
{
  const roomId = await getRoomId(userId, friendId);
  
  // Ensure conversation exists (create if doesn't)
  const conversation = await chatRepository.getConversationByRoomId(roomId);
  if (!conversation) 
  {
    await createConversation(userId, friendId);
  }
  
  // Always fetch messages separately
  const messages = await chatRepository.getMessagesByRoomId(roomId);
  
  return messages;
}

// Send message (publish to Redis)
export async function sendMessage(userId: string, friendId: string, message: string, username?: string) 
{
  // Ensure conversation exists
  const roomId = await getRoomId(userId, friendId);
  let conversation = await chatRepository.getConversationByRoomId(roomId);
  
  if (!conversation) 
  {
    await createConversation(userId, friendId);
    conversation = await chatRepository.getConversationByRoomId(roomId);
  }

  if (!conversation) 
  {
    throw new HttpError('Failed to create conversation', 500);
  }

  // Publish to Redis for WebSocket delivery
  const redisClient = getRedisClient();
  if (redisClient) 
  {
    const event = {
      type: 'chat:message',
      payload: {
        targetUserId: friendId,
        message: message,
      },
      userId: userId,
      username: username || userId,
      connectionId: '',
      timestamp: Date.now(),
    };

    await redisClient.publish('chat:events', JSON.stringify(event));
  }
  else 
  {
    // Fallback: save directly to DB if Redis unavailable
    await chatRepository.saveMessageDirect(conversation.id, userId, message);
  }
}

// Mark messages as read
export async function markMessagesAsRead(userId: string, friendId: string) 
{
  const roomId = await getRoomId(userId, friendId);
  
  const conversation = await chatRepository.getConversationByRoomId(roomId);
  if (!conversation) 
  {
    throw new HttpError('Conversation not found', 404);
  }

  await chatRepository.markMessagesAsRead(conversation.id, friendId);
}

// Get unread counts
export async function getUnreadCounts(userId: string) 
{
  const unreadCounts = await chatRepository.getUnreadCountsByUserId(userId);
  
  const unreadMap = new Map<string, number>();
  
  for (const item of unreadCounts) 
  {
    unreadMap.set(item.friendId, item.count);
  }

  return unreadMap;
}