// Main Fastify Application
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { GAME_CONFIG } from './utils/constants';
import { registerGameRoutes } from './controllers/gameController';
import { registerInputRoutes } from '../src/controllers/inputController';
import { initializeRedis, closeRedis } from '../src/communication/RedisPublisher';
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
 * Start the server
 */
export async function startServer(): Promise<void>
{
  try
  {
    // Initialize Redis
    console.log('🔄 Connecting to Redis...');
    await initializeRedis();

    // Initialize Prisma (test connection)
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Create Fastify app
    const app = await createApp();

    // Start server
    const port = GAME_CONFIG.PORT;
    const host = '0.0.0.0';

    await app.listen({ port, host });
    console.log(`🚀 Game Service running on http://${host}:${port}`);

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('🔄 Shutting down gracefully...');

      await closeRedis();
      await prisma.$disconnect();
      await app.close();

      console.log('✅ Shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }
  catch (error)
  {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module)
{
  startServer();
}