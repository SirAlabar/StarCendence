import { EventManager } from './EventManager';
import { connectionPool } from '../connections/ConnectionPool';

export function registerPingHandler(): void {
  EventManager.registerHandler('ping', async (message, connection) => {
    const pongMessage = {
      type: 'pong',
      payload: {
        timestamp: Date.now(),
        clientTimestamp: message.payload?.timestamp,
      },
      timestamp: Date.now(),
    };

    const conn = connectionPool.get(connection.connectionId);
    if (conn?.socket) {
      conn.socket.send(JSON.stringify(pongMessage));
    }
  });

}
