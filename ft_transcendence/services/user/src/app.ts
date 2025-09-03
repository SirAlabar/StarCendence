// Fastify app configuration
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as userController from './controllers/userController'
import { internalEndpointProtection } from './middleware/security.middleware'
import { fastifyErrorHandler } from './handlers/errorHandler'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Register middleware
  fastify.addHook('preHandler', internalEndpointProtection);
  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  
  fastify.get('/health', async () => ({ status: 'Health is ok!' }))
  // Public endpoints
  // fastify.get('/users/profile', userController.getCurrentUserProfile);
  // fastify.get('/users/:id/public', userController.getPublicProfile);

  // Internal endpoints 
  fastify.post('/internal/create-user', userController.createUser);
  fastify.get('/internal/users/:id', userController.getUserById);
  // fastify.get('/internal/users', userController.getAllUsers);

  return fastify
}