import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { authRoutes } from './routes/authRoutes'
import { twoFactorRoutes } from './routes/twoFactorRoutes'
import { tokenRoutes } from './routes/tokenRoutes'
import { internalEndpointProtection } from './middleware/securityMiddleware'

export async function buildApp() {
  const fastify = Fastify({ logger: true })

  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))

  fastify.register(authRoutes);
  fastify.register(twoFactorRoutes, { prefix: '/2fa' });
  fastify.register(tokenRoutes);
  // fastify.register(internalRoutes, { prefix: '/internal' });

  return fastify; 
}