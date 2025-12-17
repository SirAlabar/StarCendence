import { FastifyInstance } from 'fastify';
import * as userController from '../profile/userController';
import * as userSchema from '../profile/userSchema';
import * as friendController from '../friends/friendController';


export async function internalRoutes(fastify: FastifyInstance) {
  fastify.post('/create-user',
  {
    schema: userSchema.createUserSchema
  },
  userController.createUser);

  fastify.patch('/update-user-status',
  {
    schema: userSchema.updateUserStatusSchema
  },
  userController.updateUser);

  fastify.patch('/update-2fa-state',
  {
    schema: userSchema.updateTwoFactorStateSchema
  },
  userController.updateTwoFactorState);

  fastify.delete('/delete-user-profile',
  {
    schema: userSchema.deleteUserProfileSchema
  },
  userController.deleteUserProfile);

  fastify.get('/friends-list/:userId',
  {
    schema: userSchema.getFriendsIdsSchema
  },
  friendController.getFriendsIds);
}