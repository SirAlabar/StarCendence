import { FastifyInstance } from 'fastify';
import * as  authSchema  from '../schemas/authSchema';
import * as registerController from '../controllers/registerController';
import * as loginController from '../controllers/loginController';
import * as logoutController from '../controllers/logoutController';
import { verifyUserToken } from '../middleware/authMiddleware';

export async function authRoutes(fastify: FastifyInstance){
  fastify.post('/register', { schema: authSchema.registerSchema }, registerController.register);
  fastify.post('/login', { schema: authSchema.loginSchema }, loginController.login);
  
  // no schema needed?
  fastify.post('/logout',
  {
      preHandler: [verifyUserToken],
  },
  logoutController.logout);
}
