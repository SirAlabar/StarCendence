import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from '../controllers/userController';
import { updateUserProfileSchema } from '../schemas/userSchema';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile',
  {
    preHandler: [verifyUserToken]
  },
  userController.getUserProfile);

  fastify.put('/profile',
  {
    preHandler: [verifyUserToken],
    schema: updateUserProfileSchema
  },
  userController.updateUserProfile);

  fastify.post('/profile-img',
  {
    preHandler: [verifyUserToken]
  },
  userController.uploadProfileImage);
}