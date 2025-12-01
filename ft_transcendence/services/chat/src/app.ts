import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { internalRoutes } from './internal/internalRoutes'
import { chatRoutes } from './chat/chatRoutes'

export async function buildApp() {
  const fastify = Fastify({ logger: true })

  // Register plugins
  await fastify.register(cors, {
    origin: [
      'https://starcendence.dev',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://localhost:8443',
      'http://localhost:9090',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  })

  await fastify.register(helmet)

  // fastify.register(fastifyMetrics, { endpoint: '/metrics' });

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))
  fastify.register(internalRoutes, { prefix: '/internal' });
  fastify.register(chatRoutes);

  return fastify; 
}