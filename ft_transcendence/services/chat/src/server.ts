import dotenv from 'dotenv'
import { buildApp } from './app'

// Load environment variables
dotenv.config()

// Start server
const start = async () => {
  try {
    const app = await buildApp()
    await app.listen({ port: 3003, host: '0.0.0.0' })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()