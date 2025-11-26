/**
 * Ping/Pong Handler for WebSocket
 * 
 * Responds to client ping messages with pong to keep connections alive.
 */

import { EventManager } from './EventManager';
import { connectionPool } from '../connections/ConnectionPool';

/**
 * Register ping handler
 */
export function registerPingHandler(): void {
  EventManager.registerHandler('ping', async (message, connection) => {
    // Respond with pong
    const pongMessage = {
      type: 'pong',
      payload: {
        timestamp: Date.now(),
        clientTimestamp: message.payload?.timestamp,
      },
      timestamp: Date.now(),
    };

    // Send pong back to the client
    const conn = connectionPool.get(connection.connectionId);
    if (conn?.socket) {
      conn.socket.send(JSON.stringify(pongMessage));
    }
  });

  console.log('[PingHandler] ✅ Registered ping handler');
}
