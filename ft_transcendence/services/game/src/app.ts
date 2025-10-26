// app.ts - Just export the functions, don't try to run
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { GAME_CONFIG } from './utils/constants';
import { registerGameRoutes } from './controllers/gameController';
import { registerInputRoutes } from './controllers/inputController';
import { initializeRedis, closeRedis } from './communication/RedisPublisher';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create and configure Fastify application
 */
export async function createApp(): Promise<FastifyInstance>
{
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.LOG_PRETTY === 'true'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: GAME_CONFIG.SERVICE_NAME,
      timestamp: Date.now(),
    };
  });

  // Register routes
  registerGameRoutes(fastify);
  registerInputRoutes(fastify);

  // Error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Internal server error';

    reply.code(statusCode).send({
      error: message,
      statusCode,
    });
  });

  return fastify;
}

/**
 * Initialize services (Redis, Prisma)
 */
export async function initializeServices(): Promise<void>
{
  console.log('🔄 Connecting to Redis...');
  await initializeRedis();
  
  console.log('🔄 Connecting to database...');
  await prisma.$connect();
  console.log('✅ Database connected');
}

/**
 * Cleanup services (Redis, Prisma)
 */
export async function cleanupServices(): Promise<void>
{
  console.log('🔄 Shutting down gracefully...');
  await closeRedis();
  await prisma.$disconnect();
  console.log('✅ Shutdown complete');
}