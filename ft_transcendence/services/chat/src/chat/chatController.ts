import { FastifyRequest, FastifyReply } from 'fastify';
import * as chatService from './chatService';
import * as userServiceClient from '../clients/userServiceClient';

// Get chat history
export async function getChatHistory(req: FastifyRequest, reply: FastifyReply) 
{
  const userId = req.user?.sub;
  if (!userId) 
  {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const { friendId } = req.params as { friendId: string };
  if (!friendId) 
  {
    return reply.status(400).send({ error: 'Friend ID is required' });
  }

  // Verify friendship
  const friends = await userServiceClient.getFriendsIds(userId);
  if (!friends.includes(friendId)) 
  {
    return reply.status(403).send({ error: 'You can only get chat history with your friends' });
  }

  const messages = await chatService.getChatHistory(userId, friendId);
  
  return reply.status(200).send({
    friendId,
    messages,
  });
}

// Send message (HTTP fallback)
export async function sendMessage(req: FastifyRequest, reply: FastifyReply) 
{
  const userId = req.user?.sub;
  const username = req.user?.username;
  
  if (!userId) 
  {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const { receiverId, message } = req.body as { receiverId: string; message: string };
  
  if (!receiverId) 
  {
    return reply.status(400).send({ error: 'Receiver ID is required' });
  }

  if (!message || message.trim().length === 0) 
  {
    return reply.status(400).send({ error: 'Message cannot be empty' });
  }

  if (message.length > 1000) 
  {
    return reply.status(400).send({ error: 'Message must be 1000 characters or less' });
  }

  // Verify friendship
  const friends = await userServiceClient.getFriendsIds(userId);
  if (!friends.includes(receiverId)) 
  {
    return reply.status(403).send({ error: 'You can only send messages to your friends' });
  }

  await chatService.sendMessage(userId, receiverId, message.trim(), username);
  
  return reply.status(200).send({ success: true });
}

// Mark messages as read
export async function markAsRead(req: FastifyRequest, reply: FastifyReply) 
{
  const userId = req.user?.sub;
  if (!userId) 
  {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const { friendId } = req.params as { friendId: string };
  if (!friendId) 
  {
    return reply.status(400).send({ error: 'Friend ID is required' });
  }

  // Verify friendship
  const friends = await userServiceClient.getFriendsIds(userId);
  if (!friends.includes(friendId)) 
  {
    return reply.status(403).send({ error: 'You can only mark messages as read with your friends' });
  }

  await chatService.markMessagesAsRead(userId, friendId);
  
  return reply.status(200).send({ success: true });
}

// Get unread counts
export async function getUnreadCounts(req: FastifyRequest, reply: FastifyReply) 
{
  const userId = req.user?.sub;
  if (!userId) 
  {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const unreadMap = await chatService.getUnreadCounts(userId);
  
  // Convert Map to object for JSON response
  const unreadCounts: { [key: string]: number } = {};
  
  unreadMap.forEach((count, friendId) => 
  {
    unreadCounts[friendId] = count;
  });

  return reply.status(200).send({ unreadCounts });
}