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
import { leaderboardRoutes } from './leaderboard/leaderboardRoutes'

export async function buildApp() 
{
  const fastify = Fastify({ logger: true })
  
  // Register CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization']
  })

  // Register Helmet
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

  await fastify.register(fastifyMultipart, {
    limits: { 
      fileSize: 5 * 1024 * 1024  // 5MB
    }
  })

  // Global error handler and security hook
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is ok!' }))
  
  fastify.register(internalRoutes, { prefix: '/internal' });
  fastify.register(userRoutes);
  fastify.register(friendRoutes);
  fastify.register(leaderboardRoutes);
  fastify.register(matchHistoryRoutes);

  return fastify
}