import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as chatController from './chatController';
import * as chatSchema from './chatSchema';

export async function chatRoutes(fastify: FastifyInstance) 
{
  // GET /chat/history/:friendId - Get chat history with a friend
  fastify.get('/chat/history/:friendId',
  {
    preHandler: [verifyUserToken],
    schema: chatSchema.getChatHistorySchema,
  },
  chatController.getChatHistory);

  // POST /chat/send - Send a message
  fastify.post('/chat/send',
  {
    preHandler: [verifyUserToken],
    schema: chatSchema.sendMessageSchema,
  },
  chatController.sendMessage);

  // PATCH /chat/read/:friendId - Mark messages as read
  fastify.patch('/chat/read/:friendId',
  {
    preHandler: [verifyUserToken],
    schema: chatSchema.markAsReadSchema,
  },
  chatController.markAsRead);

  // GET /chat/unread-counts - Get unread message counts
  fastify.get('/chat/unread-counts',
  {
    preHandler: [verifyUserToken],
  },
  chatController.getUnreadCounts);
}