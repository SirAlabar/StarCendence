// WebSocket connection management
import { WebSocket } from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { ConnectionAuth, AuthResult } from './ConnectionAuth';
import { connectionPool } from './ConnectionPool';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { MESSAGE_TYPES } from '../utils/constants';

export class ConnectionManager {
  /**
   * Handle new WebSocket connection
   */
  static async handleConnection(
    socket: WebSocket,
    req: any
  ): Promise<ConnectionInfo | null> {
    try {
      // Extract token from query parameters
      const token = ConnectionAuth.extractTokenFromRequest(req.url);
      
      if (!token) {
        this.sendError(socket, 'Missing authentication token');
        socket.close(1008, 'Missing authentication token');
        return null;
      }

      // Verify token and get user info
      let authResult: AuthResult;
      try {
        authResult = ConnectionAuth.verifyToken(token);
      } catch (error: any) {
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
        socket,
        connectedAt: new Date(),
        ip: typeof ip === 'string' ? ip : ip?.[0] || undefined,
        userAgent,
      };

      // Add to connection pool
      connectionPool.add(connectionInfo);

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
      socket.on('close', () => {
        connectionPool.remove(connectionId);
      });

      // Set up error handler
      socket.on('error', (error) => {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        connectionPool.remove(connectionId);
      });

      return connectionInfo;
    } catch (error) {
      console.error('Error handling connection:', error);
      if (socket.readyState === 1) { // WebSocket.OPEN
        socket.close(1011, 'Internal server error');
      }
      return null;
    }
  }

  /**
   * Send a message to a WebSocket connection
   */
  private static sendMessage(socket: WebSocket, message: WebSocketMessage): void {
    try {
      if (socket.readyState === 1) { // WebSocket.OPEN
        socket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Send an error message to a WebSocket connection
   */
  private static sendError(socket: WebSocket, errorMessage: string): void {
    this.sendMessage(socket, {
      type: MESSAGE_TYPES.ERROR,
      payload: {
        message: errorMessage,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get connection by ID
   */
  static getConnection(connectionId: string): ConnectionInfo | undefined {
    return connectionPool.get(connectionId);
  }

  /**
   * Remove connection
   */
  static removeConnection(connectionId: string): boolean {
    return connectionPool.remove(connectionId);
  }
}
