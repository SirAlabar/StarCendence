import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { FastifyRequest } from 'fastify'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { authRoutes } from './auth/authRoutes'
import { twoFactorRoutes } from './twoFactor/twoFactorRoutes'
import { tokenRoutes } from './token/tokenRoutes'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { oauthRoutes } from './oauth/oauthRoutes'

import { httpRequestsTotal, metrics } from './metrics/metrics'

export async function buildApp() {
  const fastify = Fastify({ logger: true })



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

  await fastify.register(helmet);

  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
      if (request.url === '/metrics') {
        return;
      }
      httpRequestsTotal.inc();
    });
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))

  fastify.register(authRoutes);
  fastify.register(oauthRoutes);
  fastify.register(twoFactorRoutes, { prefix: '/2fa' });
  fastify.register(tokenRoutes);
  fastify.register(metrics);

  return fastify; 
}