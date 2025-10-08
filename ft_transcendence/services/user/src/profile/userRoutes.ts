import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from './userController';
import { updateUserProfileSchema } from './userSchema';
import { UpdateUserBody } from './user.types';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile',
  {
    preHandler: [verifyUserToken]
  },
  userController.getUserProfile);

  fastify.put<{ Body: UpdateUserBody }>
  ('/profile',
  {
    preHandler: [verifyUserToken],
    schema: updateUserProfileSchema
  },
  userController.updateUserProfile);

  fastify.post('/profile-image',
  {
    preHandler: [verifyUserToken]
  },
  userController.uploadProfileImage);
}