import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as userController from './controllers/userController'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { verifyUserToken } from './middleware/authMiddleware'
import { internalRoutes } from './routes/internalRoutes'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Global error handler and security hook
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is ok!' }))
  
  fastify.register(internalRoutes, { prefix: '/internal' });
  fastify.get('/profile', { preHandler: [verifyUserToken] }, userController.getCurrentUserProfile);

  return fastify
}