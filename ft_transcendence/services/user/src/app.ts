import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import fastifyMultipart from '@fastify/multipart'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { internalRoutes } from './internal/internalRoutes'
import { userRoutes } from './profile/userRoutes'
import { friendRoutes } from './friends/friendRoutes'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization']
    })

    await fastify.register(helmet, {
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', '*'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"]
        }
      }
    })

  // Global error handler and security hook
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is ok!' }))
  
  fastify.register(internalRoutes, { prefix: '/internal' });
  
  fastify.register(userRoutes);
  fastify.register(friendRoutes);

  return fastify
}