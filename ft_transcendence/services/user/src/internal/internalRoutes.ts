import { FastifyInstance } from 'fastify';
import * as userController from '../profile/userController';
import * as userSchema from '../profile/userSchema';


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
}