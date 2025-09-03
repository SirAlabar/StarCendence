// Fastify app configuration
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as registerController from './controllers/registerController'
import { fastifyErrorHandler } from './handlers/errorHandler'

export async function buildApp() {
  const fastify = Fastify({ logger: true })
  
  // Register plugins
  await fastify.register(cors)
  await fastify.register(helmet)

  // Global error handler
  fastify.setErrorHandler(fastifyErrorHandler);
  
  fastify.get('/health', async () => ({ status: 'Ok' }))

  fastify.post('/register', { schema: registerController.registerSchema }, registerController.register);

  return fastify
}