// Fastify app configuration
import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

export async function buildApp() {
  const app = fastify({ logger: true })
  
  // Register plugins
  await app.register(cors)
  await app.register(helmet)
  
  app.get('/health', async () => ({ status: 'ok' }))

  return app
}