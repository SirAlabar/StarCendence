import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

// Include player customization updates so Game service can persist & broadcast paddle changes
const lobbyEvents = ['lobby:create', 'lobby:invite', 'lobby:join', 'lobby:leave', 'lobby:kick', 'lobby:ready', 'lobby:start', 'lobby:chat', 'lobby:player:update'];

for (const eventType of lobbyEvents)
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