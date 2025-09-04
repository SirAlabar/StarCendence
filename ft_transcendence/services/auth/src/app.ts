// Fastify app configuration
import Fastify from 'fastify'
import { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyErrorHandler } from './handlers/errorHandler'
import * as registerController from './controllers/registerController'
import * as loginController from './controllers/loginController'
import * as logoutController from './controllers/logoutController'
import * as refreshController from './controllers/refreshController'
import { authenticateToken } from './middleware/authMiddleware'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))

  fastify.post('/register', { schema: registerController.registerSchema }, registerController.register);
  fastify.post('/login', { schema: loginController.loginSchema }, loginController.login);

  fastify.post('/refresh', { schema: refreshController.refreshTokenSchema }, refreshController.refreshAccessToken);

  fastify.post('/logout', { schema: logoutController.logoutSchema }, logoutController.logout);
  fastify.post('/logout-all', { schema: logoutController.logoutAllDevicesSchema }, logoutController.logoutAllDevices);

  fastify.get('/verify', { preHandler: [authenticateToken] }, async (req: FastifyRequest, reply: FastifyReply) => {
    return { success: true, user: req.user };
  }); 

  return fastify; 
} 