// Fastify app configuration
import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as userController from './controllers/userController'

export async function buildApp() {
  const app = fastify({ logger: true })
  
  // Register plugins
  await app.register(cors)
  await app.register(helmet)
  
  // Register routes - clean and meaningful!
  app.get('/users/:id', userController.getUserById)
  app.get('/users/', userController.getAllUsers)
  
  app.post('/users/', userController.createUser)

  return app
}