// Game-related events
import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

EventManager.registerHandler('game', async (message: WebSocketMessage, connection: ConnectionInfo): Promise<void> =>
{
  console.log(`Game event received from user ${connection.userId}:`, {
    connectionId: connection.connectionId,
    userId: connection.userId,
    messageType: message.type,
    payload: message.payload,
  });

  // Publish to Redis channel 'game'
  await redisBroadcast.publishToChannel('game', message);
  console.log("Game event published");
});

