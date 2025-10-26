// Server Entry Point - Start the Fastify application
import { createApp } from './app';
import { GAME_CONFIG } from './utils/constants';

/**
 * Start the server
 */
async function startServer(): Promise<void>
{
  try
  {
    const app = await createApp();

    // Start listening
    await app.listen({
      port: GAME_CONFIG.PORT,
      host: '0.0.0.0', // Important for Docker!
    });

    console.log(`🚀 Game Service running on http://0.0.0.0:${GAME_CONFIG.PORT}`);
  }
  catch (error)
  {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️ SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});