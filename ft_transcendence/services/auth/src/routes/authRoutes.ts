import { FastifyInstance } from 'fastify';
import * as  authSchema  from '../schemas/authSchema';
import * as registerController from '../controllers/registerController';
import * as loginController from '../controllers/loginController';
import * as refreshController from '../controllers/refreshController';
import * as logoutController from '../controllers/logoutController';
import { authenticateToken } from '../middleware/authMiddleware';

export async function authRoutes(fastify: FastifyInstance){
  fastify.post('/register', { schema: authSchema.registerSchema }, registerController.register);
  fastify.post('/login', { schema: authSchema.loginSchema }, loginController.login);

  fastify.post('/logout',
  {
      preHandler: [authenticateToken],
      schema: authSchema.logoutSchema
  },
  logoutController.logout);

  // hidden endpoint to refresh access token using refresh token - TODO: secure this endpoint
  fastify.post('/refresh', { schema: authSchema.refreshTokenSchema }, refreshController.refreshAccessToken);
}
