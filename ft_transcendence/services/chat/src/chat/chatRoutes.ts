import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as chatController from './chatController';
import * as chatSchema from './chatSchema';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/conversation/:targetUserId',
  {
    preHandler: [verifyUserToken],
  },
  chatController.getConversation);

  fastify.post('/conversations',
  {
    preHandler: [verifyUserToken],
    schema: chatSchema.createConversationSchema,
  },
  chatController.createConversation);

  // fastify.patch('/messages/:id/status',
  // {
  //   preHandler: [verifyUserToken],
  // },
  // chatController.updateMessageStatus);

  // fastify.get('/conversations/:id/messages',
  // {
  //   preHandler: [verifyUserToken],
  // },
  // chatController.getMessages);
}
