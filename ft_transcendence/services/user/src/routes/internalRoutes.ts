import { FastifyInstance } from 'fastify';
import * as userController from '../controllers/userController';
import * as userSchema from '../schemas/userSchema';


export async function internalRoutes(fastify: FastifyInstance) {
  fastify.post('/create-user',
  {
    schema: userSchema.createUserSchema
  },
  userController.createUser);

}