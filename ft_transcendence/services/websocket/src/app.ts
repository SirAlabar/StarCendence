// WebSocket server configuration
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import websocket from '@fastify/websocket';
import { getWSConfig } from './config/wsConfig';
import { ConnectionManager } from './connections/ConnectionManager';
import { redisBroadcast } from './broadcasting/RedisBroadcast';
import { createRedisClient, closeRedisClient } from './config/redisConfig';
import { registerPingHandler } from './events/PingHandler';
import { initializeRedisHandlers } from './events/RedisEvents';
import './events/GameEvents';
import './events/LobbyEvents';
import './events/ChatEvents';
import './events/TournamentEvents';
import { httpRequestsTotal, metrics } from './metrics/metrics';


export async function createApp(): Promise<FastifyInstance>
{
  const app = Fastify({logger: {level: process.env.LOG_LEVEL || 'info',},});

  app.register(metrics);

  app.addHook('onRequest', async (request: FastifyRequest) => {
      if (request.url === '/metrics') {
        return;
      }
      httpRequestsTotal.inc();
    });

  // Initialize Redis and pub/sub
  try
  {
    await createRedisClient();
    await redisBroadcast.initialize();
    
    // Initialize all Redis handlers (game forwarder, broadcast handler, etc.)
    await initializeRedisHandlers();
    
    // Register ping/pong handler
    registerPingHandler();
    
    console.log('Redis pub/sub initialized');
    console.log('All event handlers initialized');
  }
  catch (error)
  {
    console.error('Failed to initialize Redis:', error);
    console.warn('Continuing without Redis NOT RECOMMENDED');
  }

  // Register WebSocket plugin
  await app.register(websocket);

  const config = getWSConfig();

  // Health check endpoint
  app.get(config.healthPath, async (request: FastifyRequest, reply: FastifyReply) =>
  {
    return reply.send(
    {
      status: 'ok'
    });
  });

  // WebSocket route
  app.register(async function (fastify)
  {
    fastify.get(config.path,
    {
      websocket: true
    },
    (connection: any, req: FastifyRequest) =>
    {
      // Get the socket from the connection
      const socket = connection.socket || connection;
      
      // Process connection through ConnectionManager
      ConnectionManager.handleConnection(socket, req).catch((error) =>
      {
        console.error('Error in ConnectionManager.handleConnection:', error);
        if (socket && socket.readyState === 1) // WebSocket.OPEN
        {
          socket.close(1011, 'Internal server error');
        }
      });
    });
  });

  // Graceful shutdown handler
  app.addHook('onClose', async (instance: FastifyInstance) =>
  {
    console.log('Shutting down WebSocket server...');
    
    // Close Redis pub/sub
    if (redisBroadcast.isInitialized())
    {
      await redisBroadcast.shutdown();
    }
    
    // Close Redis client
    await closeRedisClient();
    
    console.log('Shutdown complete');
  });

  return app;
}
