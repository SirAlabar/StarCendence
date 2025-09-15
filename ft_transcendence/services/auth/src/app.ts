// Fastify app configuration
import { FastifyRequest, FastifyReply } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { authRoutes } from './routes/authRoutes'
import { twoFactorRoutes } from './routes/twoFactorRoutes'
import { internalRoutes } from './routes/internalRoutes'

export async function buildApp() {
  const fastify = Fastify({ logger: true })

  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))

  fastify.register(authRoutes);
  fastify.register(twoFactorRoutes, { prefix: '/2fa' });
  fastify.register(internalRoutes, { prefix: '/internal' });

  return fastify; 
}