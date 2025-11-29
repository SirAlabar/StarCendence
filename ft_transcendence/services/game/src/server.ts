// server.ts - Entry point
import { createApp, initializeServices, cleanupServices } from './app';
import { GAME_CONFIG } from './utils/constants';

/**
 * Start the server
 */
async function startServer(): Promise<void>
{
  try
  {
    // Initialize services first
    await initializeServices();
    
    // Create app
    const app = await createApp();
    
    // Start listening
    await app.listen({
      port: GAME_CONFIG.PORT,
      host: '0.0.0.0',
    });
    
    console.log(` Game Service running on http://0.0.0.0:${GAME_CONFIG.PORT}`);
  }
  catch (error)
  {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  await cleanupServices();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});