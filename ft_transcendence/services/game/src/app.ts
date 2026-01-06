// app.ts - Just export the functions, don't try to run
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { GAME_CONFIG } from './utils/constants';
import { registerGameRoutes } from './controllers/gameController';
import { registerInputRoutes } from './controllers/inputController';
import { initializeRedis, closeRedis, getRedisClient } from './communication/RedisPublisher';
import { GameEventSubscriber } from './communication/GameEventSubscriber';
import { LobbyManager } from './managers/LobbyManager';
import { PrismaClient } from '@prisma/client';
import { matchHistoryRoutes } from './match_history/matchHistoryRoutes';

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

  fastify.register(matchHistoryRoutes);
  

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
 * Initialize services (Redis, Prisma, Game Event Subscriber)
 */
export async function initializeServices(): Promise<void>
{
  console.log('🔄 Connecting to Redis...');
  await initializeRedis();
  
  console.log('🔄 Connecting to database...');
  await prisma.$connect();
  console.log('✅ Database connected');

  // Initialize game event subscriber (listens to game:events from WebSocket)
  console.log('🔄 Initializing Game Event Subscriber...');
  const redisClient = getRedisClient();
  if (redisClient) {
    // Create separate Redis clients for subscriber and publisher
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    
    const publisher = redisClient.duplicate();
    await publisher.connect();
    
    // Create lobby manager
    const lobbyManager = new LobbyManager(redisClient);
    
    // Initialize game event subscriber
    const gameEventSubscriber = new GameEventSubscriber(subscriber, publisher, lobbyManager);
    await gameEventSubscriber.initialize();
    
    // Test Redis pub/sub: Subscribe to test channel
    await subscriber.subscribe('test:channel', (message) => {
      console.log('✅ Redis test received:', message);
      publisher.publish('test:response', 'test!').catch(err => 
        console.error('Failed to send test response:', err)
      );
    });
    
    console.log('✅ Game Event Subscriber initialized');
  } else {
    console.error('❌ Failed to initialize Game Event Subscriber: Redis client not available');
  }
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