import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyErrorHandler } from './handlers/errorHandler'
import { internalEndpointProtection } from './middleware/securityMiddleware'
import { initializeRedis, closeRedis, getRedisClient } from './communication/RedisPublisher';
import { ChatEventSubscriber } from './communication/ChatEventSubscriber';
import { internalRoutes } from './internal/internalRoutes'
import { chatRoutes } from './chat/chatRoutes'
//import { ChatManager } from './managers/chatManager'  

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

  // Initialize Redis connection
  await initializeRedis();
  
  const redisClient = getRedisClient();
  if (redisClient) {
    // Create separate Redis clients for subscriber and publisher
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    
    const publisher = redisClient.duplicate();
    await publisher.connect();

    //const chatManager = new ChatManager();
    const chatEventSubscriber = new ChatEventSubscriber(subscriber, publisher/*, chatManager*/);
    await chatEventSubscriber.initialize();
    console.log("Created redis chat subscriber");
  }
  else
  {
    console.log("could not initialize redis");
  }

    

  // fastify.register(fastifyMetrics, { endpoint: '/metrics' });

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  fastify.addHook('preHandler', internalEndpointProtection);
  
  fastify.get('/health', async () => ({ status: 'Health is Ok!' }))
  fastify.register(internalRoutes, { prefix: '/internal' });
  fastify.register(chatRoutes);

  return fastify; 
}