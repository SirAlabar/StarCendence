// WebSocket server configuration
import Fastify, { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { getWSConfig } from './config/wsConfig';
import { ConnectionManager } from './connections/ConnectionManager';
import { redisBroadcast } from './broadcasting/RedisBroadcast';
import { createRedisClient, closeRedisClient } from './config/redisConfig';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Initialize Redis and pub/sub
  try {
    await createRedisClient();
    await redisBroadcast.initialize();
    console.log('Redis pub/sub initialized');
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    console.warn('Continuing without Redis (cross-server broadcasting will be disabled)');
  }

  // Register WebSocket plugin
  await app.register(websocket);

  const config = getWSConfig();

  // Health check endpoint
  app.get(config.healthPath, async (request, reply) => {
    return reply.send({ status: 'ok' });
  });

  // WebSocket route
  app.register(async function (fastify) {
    fastify.get(config.path, { websocket: true }, (connection, req) => {
      // Handle WebSocket connection
      const { socket } = connection;
      
      // Process connection through ConnectionManager
      ConnectionManager.handleConnection(socket, req).catch((error) => {
        console.error('Error in ConnectionManager.handleConnection:', error);
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.close(1011, 'Internal server error');
        }
      });
    });
  });

  // Graceful shutdown handler
  app.addHook('onClose', async (instance) => {
    console.log('Shutting down WebSocket server...');
    
    // Close Redis pub/sub
    if (redisBroadcast.isInitialized()) {
      await redisBroadcast.shutdown();
    }
    
    // Close Redis client
    await closeRedisClient();
    
    console.log('Shutdown complete');
  });

  return app;
}
