import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from './userController';
import * as userSchema from './userSchema';
import * as userRepository from './userRepository';

export async function userRoutes(fastify: FastifyInstance) 
{
  // Find all user profiles -- DEBUG PURPOSES
  fastify.get('/profiles',
    async (request: any, reply: any) => 
    {
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
    schema: userSchema.searchUserByUsernameSchema
  },
  userController.getUserProfileByUsername);

  fastify.get('/users/search',
  {
    preHandler: [verifyUserToken],
    schema: userSchema.searchUsersSchema
  },
  userController.searchUsers);

  fastify.patch('/profile',
  {
    preHandler: [verifyUserToken],
    schema: userSchema.updateUserProfileSchema
  },
  userController.updateUserProfile);

  fastify.post('/profile-image',
  {
    preHandler: [verifyUserToken]
  },
  userController.uploadProfileImage);

  fastify.get('/rank',
  {
    preHandler: [verifyUserToken]
  },
  userController.getUserRank);

  fastify.patch('/settings',
  {
    preHandler: [verifyUserToken],
    schema: userSchema.updateUserSettingsSchema
  },
  userController.updateUserSettings);

  fastify.delete('/profile',
  {
    preHandler: [verifyUserToken]
  },
  userController.deleteUserProfile);
}