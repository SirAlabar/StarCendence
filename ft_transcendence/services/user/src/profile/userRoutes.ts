import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from './userController';
import { searchUserByUsernameSchema, updateUserProfileSchema } from './userSchema';
import { UpdateUserBody } from './user.types';
import * as userRepository from './userRepository';

export async function userRoutes(fastify: FastifyInstance) {

  // Find all user profiles -- DEBUG PURPOSES
  fastify.get('/profiles',
   async (request: any, reply: any) => {
     const profiles = await userRepository.findAllUserProfiles();
     return profiles;
   }
  );

  fastify.get('/profile',
  {
    preHandler: [verifyUserToken]
  },
  userController.getUserProfile);

  fastify.get('/profile/:username',
  {
    preHandler: [verifyUserToken],
    schema: searchUserByUsernameSchema
  },
  userController.getUserProfileByUsername);

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