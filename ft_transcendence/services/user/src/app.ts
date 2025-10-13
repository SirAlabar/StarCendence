import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import fastifyMultipart from '@fastify/multipart'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { internalRoutes } from './internal/internalRoutes'
import { userRoutes } from './profile/userRoutes'
import { friendRoutes } from './friends/friendRoutes'
import { matchHistoryRoutes } from './match_history/matchHistoryRoutes'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)
  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
  })

  // Global error handler and security hook
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is ok!' }))
  
  fastify.register(internalRoutes, { prefix: '/internal' });
  
  fastify.register(userRoutes);
  fastify.register(friendRoutes);
  fastify.register(matchHistoryRoutes)

  return fastify
}