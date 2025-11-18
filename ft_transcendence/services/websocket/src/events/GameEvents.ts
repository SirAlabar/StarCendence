// Game-related events
import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';

EventManager.registerHandler('game', async (message: WebSocketMessage, connection: ConnectionInfo): Promise<void> =>
{
  console.log(`Game event received from user ${connection.userId}:`, {
    connectionId: connection.connectionId,
    userId: connection.userId,
    messageType: message.type,
    payload: message.payload,
  });
});

