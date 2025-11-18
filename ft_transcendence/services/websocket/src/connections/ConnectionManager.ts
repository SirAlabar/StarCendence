// WebSocket connection management
import { WebSocket } from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { ConnectionAuth, AuthResult } from './ConnectionAuth';
import { connectionPool } from './ConnectionPool';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { MESSAGE_TYPES } from '../utils/constants';
import { EventManager } from '../events/EventManager';

export class ConnectionManager
{
  static async handleConnection(
    socket: WebSocket,
    req: any
  ): Promise<ConnectionInfo | null>
  {
    try
    {
      // Extract token from query parameters
      const token = ConnectionAuth.extractTokenFromRequest(req.url);
      
      if (!token)
      {
        this.sendError(socket, 'Missing authentication token');
        socket.close(1008, 'Missing authentication token');
        return null;
      }

      // Verify token and get user info
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

      // Generate unique connection ID
      const connectionId = randomUUID();

      // Extract client information from request headers
      const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Create connection info
      const connectionInfo: ConnectionInfo = {
        connectionId,
        userId: authResult.userId,
        username: authResult.username,
        socket,
        connectedAt: new Date(),
        ip: typeof ip === 'string' ? ip : ip?.[0] || undefined,
        userAgent,
      };

      // Add to connection pool
      connectionPool.add(connectionInfo);

      // Log that someone connected
      console.log(`WebSocket connection established:`, {
        connectionId,
        userId: authResult.userId,
        username: authResult.username,
        ip: connectionInfo.ip,
        timestamp: new Date().toISOString(),
      });

      // Log connected users summary
      connectionPool.logConnectedUsers();

      // Send connection acknowledgment
      this.sendMessage(socket, {
        type: MESSAGE_TYPES.CONNECTION_ACK,
        payload: {
          connectionId,
          userId: authResult.userId,
          timestamp: Date.now(),
        },
      });

      // Set up connection close handler
      socket.on('close', (code, reason) =>
      {
        console.log(`WebSocket connection closed:`, {
          connectionId,
          userId: authResult.userId,
          username: authResult.username,
          code,
          reason: reason?.toString(),
          timestamp: new Date().toISOString(),
        });
        connectionPool.remove(connectionId);
        // Show how many users are connected now
        connectionPool.logConnectedUsers();
      });

      // Set up error handler
      socket.on('error', (error) =>
      {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        connectionPool.remove(connectionId);
      });

      // Set up message handler to log incoming messages
      socket.on('message', async (rawMessage: Buffer | string) =>
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
            console.log(`[WebSocket] Received invalid JSON from connection ${connectionId}:`, messageStr);
            return;
          }

          // Log received message
          console.log(`[WebSocket] Message received from connection ${connectionId} (user: ${authResult.username || authResult.userId}):`, {
            connectionId,
            userId: authResult.userId,
            username: authResult.username,
            messageType: message.type,
            payload: message.payload,
            timestamp: message.timestamp || new Date().toISOString(),
            receivedAt: new Date().toISOString(),
          });

          // Route message to EventManager
          await EventManager.handleMessage(message, connectionInfo);
        }
        catch (error)
        {
          console.error(`[WebSocket] Error processing message from connection ${connectionId}:`, error);
        }
      });

      return connectionInfo;
    }
    catch (error)
    {
      console.error('Error handling connection:', error);
      if (socket.readyState === 1) // WebSocket.OPEN
      {
        socket.close(1011, 'Internal server error');
      }
      return null;
    }
  }

  private static sendMessage(socket: WebSocket, message: WebSocketMessage): void
  {
    try
    {
      if (socket.readyState === 1) // WebSocket.OPEN
      {
        socket.send(JSON.stringify(message));
      }
    }
    catch (error)
    {
      console.error('Error sending message:', error);
    }
  }

  private static sendError(socket: WebSocket, errorMessage: string): void
  {
    this.sendMessage(socket, {
      type: MESSAGE_TYPES.ERROR,
      payload: {
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
