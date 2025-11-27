import { WebSocket } from '@fastify/websocket';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { EventManager } from '../events/EventManager';

export class MessageHandler
{
  static async handleIncomingMessage(
    rawMessage: Buffer | string,
    connectionInfo: ConnectionInfo
  ): Promise<void>
  {
    try
    {
      const messageStr = typeof rawMessage === 'string' ? rawMessage : rawMessage.toString('utf-8');
      let message: WebSocketMessage;
      
      try
      {
        message = JSON.parse(messageStr);
      }
      catch (parseError)
      {
        return;
      }

      await EventManager.handleMessage(message, connectionInfo);
    }
    catch (error)
    {
      console.error(`[WebSocket] Error processing message from connection ${connectionInfo.connectionId}:`, error);
    }
  }

  static sendMessage(socket: WebSocket, message: WebSocketMessage): void
  {
    try
    {
      if (socket.readyState === 1)
      {
        socket.send(JSON.stringify(message));
      }
    }
    catch (error) {}
  }
}
