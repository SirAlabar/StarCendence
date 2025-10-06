import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { internalRoutes } from './routes/internalRoutes'
import { userRoutes } from './routes/userRoutes'

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
  
  fastify.register(userRoutes);
  // fastify.register(friendRoutes);

  return fastify
}