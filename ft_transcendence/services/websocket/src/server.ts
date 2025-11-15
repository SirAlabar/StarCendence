// WebSocket server entry point
import { createApp } from './app';
import { getWSConfig } from './config/wsConfig';
import { connectionPool } from './connections/ConnectionPool';

async function start() {
  try {
    const app = await createApp();
    const config = getWSConfig();

    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`WebSocket server listening on ${address}`);
    console.log(`WebSocket path: ${config.path}`);
    console.log(`Health check: ${address}${config.healthPath}`);
    console.log(`Environment: ${config.nodeEnv}`);

    // Periodic logging of connected users (every 2 minutes)
    setInterval(() => {
      connectionPool.logConnectedUsers();
    }, 120000); // 2 minutes

    // Log initial state
    connectionPool.logConnectedUsers();
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();
