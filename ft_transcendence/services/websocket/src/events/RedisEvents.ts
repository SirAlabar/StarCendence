import { redisBroadcast } from '../broadcasting/RedisBroadcast';
import { connectionPool } from '../connections/ConnectionPool';

interface WebSocketBroadcastMessage
{
  type: string;
  payload: any;
  timestamp?: number;
}

interface BroadcastRequest
{
  userIds?: string[];
  targetUserId?: string;
  connectionIds?: string[];
  message: WebSocketBroadcastMessage;
}


async function handleBroadcastRequest(data: any): Promise<void>
{
  try
  {
    const request = data as BroadcastRequest;
   
    console.log("sent from server ", request.message, " to ", request.userIds);
    if (!request.message || !request.message.type)
    {
      return;
    }

    if (request.userIds && request.userIds.length > 0)
    {
      for (const userId of request.userIds)
      {
        const connections = connectionPool.getConnectionsByUserId(userId);
        for (const connection of connections)
        {
          try
          {
            if (connection.socket.readyState === 1)
            {
              connection.socket.send(JSON.stringify(request.message));
            }
          }
          catch (error) {}
        }
      }
    }
    else if (request.targetUserId)
    {
      connectionPool.broadcastToUser(request.targetUserId, request.message);
    }
    else if (request.connectionIds && request.connectionIds.length > 0)
    {
      for (const connectionId of request.connectionIds)
      {
        const connection = connectionPool.get(connectionId);
        if (connection)
        {
          try
          {
            if (connection.socket.readyState === 1)
            {
              connection.socket.send(JSON.stringify(request.message));
            }
          }
          catch (error) {}
        }
      }
    }
  }
  catch (error) {}
}

export async function initializeRedisHandlers(): Promise<void>
{
  await redisBroadcast.subscribeToChannel('websocket:broadcast');
  await redisBroadcast.registerChannelHandler('websocket:broadcast', '*', handleBroadcastRequest);
}


