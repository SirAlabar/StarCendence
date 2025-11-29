import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

const gameEvents = ['game:move', 'game:action', 'game:start', 'game:pause', 'game:resume', 'game:end'];

for (const eventType of gameEvents)
{
  EventManager.registerHandler(eventType, async (message: WebSocketMessage, connection: ConnectionInfo): Promise<void> =>
  {
    await redisBroadcast.publishToChannel('game:events',
    {
      type: message.type,
      payload: message.payload,
      userId: connection.userId,
      username: connection.username,
      connectionId: connection.connectionId,
      timestamp: message.timestamp || Date.now(),
    });
  });
} 

