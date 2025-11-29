import { WebSocket } from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { ConnectionAuth, AuthResult } from './ConnectionAuth';
import { connectionPool } from './ConnectionPool';
import { ConnectionInfo } from '../types/connection.types';
import { MESSAGE_TYPES } from '../utils/constants';
import { MessageHandler } from './MessageHandler';

export class ConnectionManager
{
  static async handleConnection(
    socket: WebSocket,
    req: any
  ): Promise<ConnectionInfo | null>
  {
    try
    {
      const token = ConnectionAuth.extractTokenFromRequest(req.url);
      
      if (!token)
      {
        this.sendError(socket, 'Missing authentication token');
        socket.close(1008, 'Missing authentication token');
        return null;
      }

      let authResult: AuthResult;
      try
      {
        authResult = ConnectionAuth.verifyToken(token);
      }
      catch (error: any)
      {
        this.sendError(socket, error.message || 'Invalid authentication token');
        socket.close(1008, error.message || 'Invalid authentication token');
        return null;
      }

      const connectionId = randomUUID();
      const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const connectionInfo: ConnectionInfo =
      {
        connectionId,
        userId: authResult.userId,
        username: authResult.username,
        socket,
        connectedAt: new Date(),
        ip: typeof ip === 'string' ? ip : ip?.[0] || undefined,
        userAgent,
      };

      connectionPool.add(connectionInfo);
      connectionPool.logConnectedUsers();

      MessageHandler.sendMessage(socket,
      {
        type: MESSAGE_TYPES.CONNECTION_ACK,
        payload:
        {
          connectionId,
          userId: authResult.userId,
          timestamp: Date.now(),
        },
      });

      socket.on('close', (code, reason) =>
      {
        connectionPool.remove(connectionId);
        connectionPool.logConnectedUsers();
      });

      socket.on('error', (error) =>
      {
        connectionPool.remove(connectionId);
      });

      socket.on('message', async (rawMessage: Buffer | string) =>
      {
        await MessageHandler.handleIncomingMessage(rawMessage, connectionInfo);
      });

      return connectionInfo;
    }
    catch (error)
    {
      if (socket.readyState === 1)
      {
        socket.close(1011, 'Internal server error');
      }
      return null;
    }
  }

  private static sendError(socket: WebSocket, errorMessage: string): void
  {
    MessageHandler.sendMessage(socket,
    {
      type: MESSAGE_TYPES.ERROR,
      payload:
      {
        message: errorMessage,
        timestamp: Date.now(),
      },
    });
  }

  static getConnection(connectionId: string): ConnectionInfo | undefined
  {
    return connectionPool.get(connectionId);
  }

  static removeConnection(connectionId: string): boolean
  {
    return connectionPool.remove(connectionId);
  }
}
