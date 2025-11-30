import { FastifyRequest, FastifyReply } from 'fastify';
import * as chatService from './chatService';
import * as userServiceClient from '../clients/userServiceClient';

// POST /conversations - Create a new conversation
export async function createConversation(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) {
    return reply.status(400).send({ error: 'Target user ID is required' });
  }

  const friends = await userServiceClient.getFriendsIds(userId);
  if (!friends.includes(targetUserId)) {
    return reply.status(403).send({ error: 'You can only start conversations with your friends' });
  }

  const conversation = await chatService.createConversation(userId, targetUserId);
  return reply.status(201).send(conversation);
}

// Get /conversations/:targetUserId - Get conversation with a specific user
export async function getConversation(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(400).send({ error: 'Invalid user' });
  }

  const { targetUserId } = req.params as { targetUserId: string };
  if (!targetUserId) {
    return reply.status(400).send({ error: 'Target user ID is required' });
  }

  const friends = await userServiceClient.getFriendsIds(userId);
  if (!friends.includes(targetUserId)) {
    return reply.status(403).send({ error: 'You can only get conversations with your friends' });
  }

  const conversation = await chatService.getConversationBetweenUsers(userId, targetUserId);
  if (!conversation) {
    return reply.status(404).send({ error: 'Conversation not found' });
  }

  return reply.status(200).send(conversation);
}