import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from '../controllers/userController';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile',
  {
    preHandler: [verifyUserToken]
  },
  userController.getCurrentUserProfile);

  // fastify.put('/profile',
  // {
  //   preHandler: [verifyUserToken]
  // },
  // userController.updateUserProfile);
}