import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

EventManager.registerHandler('chat', async (message: WebSocketMessage, connection: ConnectionInfo): Promise<void> =>
{
  await redisBroadcast.publishToChannel('chat:events',
  {
    type: message.type,
    payload: message.payload,
    userId: connection.userId,
    username: connection.username,
    connectionId: connection.connectionId,
    timestamp: message.timestamp || Date.now(),
  });
});