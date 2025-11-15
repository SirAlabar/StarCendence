// Redis pub/sub for cross-server broadcasting
import { RedisClientType } from 'redis';
import { getRedisClient, isRedisConnected } from '../config/redisConfig';
import { connectionPool } from '../connections/ConnectionPool';
import { WebSocketMessage } from '../types/connection.types';

export interface BroadcastMessage {
  type: string;
  payload: any;
  targetUserId?: string;
  timestamp?: number;
}

export class RedisBroadcast {
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private readonly channel = 'websocket:broadcast';
  private isSubscribed = false;

  /**
   * Initialize Redis pub/sub
   */
  async initialize(): Promise<void> {
    try {
      if (!isRedisConnected()) {
        await getRedisClient();
      }

      // For Redis v4+, we need separate client connections for pub/sub
      // Create subscriber client
      const { getRedisConfig } = require('../config/redisConfig');
      const redisConfig = getRedisConfig();
      const { createClient } = require('redis');
      
      this.subscriber = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
      }) as RedisClientType;

      this.publisher = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
      }) as RedisClientType;

      // Connect both clients
      await this.subscriber.connect();
      await this.publisher.connect();

      // Setup subscriber event handlers
      this.subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
      });

      this.publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
      });

      // Subscribe to broadcast channel
      await this.subscriber.subscribe(this.channel, (message) => {
        this.handleIncomingMessage(message);
      });

      this.isSubscribed = true;
      console.log(`Redis broadcast subscribed to channel: ${this.channel}`);
    } catch (error) {
      console.error('Failed to initialize Redis broadcast:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message from Redis pub/sub
   */
  private handleIncomingMessage(message: string): void {
    try {
      const broadcastMessage: BroadcastMessage = JSON.parse(message);

      // Don't process our own messages (optional: add server ID check)
      if (broadcastMessage.targetUserId) {
        // Broadcast to specific user's connections
        const connections = connectionPool.getConnectionsByUserId(broadcastMessage.targetUserId);
        
        for (const connection of connections) {
          try {
            if (connection.socket.readyState === 1) { // WebSocket.OPEN
              const wsMessage: WebSocketMessage = {
                type: broadcastMessage.type,
                payload: broadcastMessage.payload,
                timestamp: broadcastMessage.timestamp || Date.now(),
              };
              connection.socket.send(JSON.stringify(wsMessage));
            }
          } catch (error) {
            console.error(`Error sending message to connection ${connection.connectionId}:`, error);
          }
        }
      } else {
        // Broadcast to all connections on this server
        const allConnections = connectionPool.getAll();
        
        for (const connection of allConnections) {
          try {
            if (connection.socket.readyState === 1) { // WebSocket.OPEN
              const wsMessage: WebSocketMessage = {
                type: broadcastMessage.type,
                payload: broadcastMessage.payload,
                timestamp: broadcastMessage.timestamp || Date.now(),
              };
              connection.socket.send(JSON.stringify(wsMessage));
            }
          } catch (error) {
            console.error(`Error sending message to connection ${connection.connectionId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling Redis broadcast message:', error);
    }
  }

  /**
   * Publish message to Redis channel for cross-server broadcasting
   */
  async publish(message: BroadcastMessage): Promise<void> {
    try {
      if (!this.publisher || !this.publisher.isReady) {
        console.warn('Redis publisher not ready, skipping broadcast');
        return;
      }

      const messageStr = JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now(),
      });

      await this.publisher.publish(this.channel, messageStr);
    } catch (error) {
      console.error('Error publishing to Redis:', error);
    }
  }

  /**
   * Broadcast message to specific user across all servers
   */
  async broadcastToUser(userId: string, type: string, payload: any): Promise<void> {
    await this.publish({
      type,
      payload,
      targetUserId: userId,
    });
  }

  /**
   * Broadcast message to all users across all servers
   */
  async broadcastToAll(type: string, payload: any): Promise<void> {
    await this.publish({
      type,
      payload,
    });
  }

  /**
   * Unsubscribe and close Redis connections
   */
  async shutdown(): Promise<void> {
    try {
      if (this.isSubscribed && this.subscriber) {
        await this.subscriber.unsubscribe(this.channel);
        this.isSubscribed = false;
      }

      if (this.subscriber && this.subscriber.isReady) {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      if (this.publisher && this.publisher.isReady) {
        await this.publisher.quit();
        this.publisher = null;
      }

      console.log('Redis broadcast shutdown complete');
    } catch (error) {
      console.error('Error shutting down Redis broadcast:', error);
    }
  }

  /**
   * Check if Redis broadcast is initialized
   */
  isInitialized(): boolean {
    return this.isSubscribed && 
           this.subscriber !== null && 
           this.subscriber.isReady &&
           this.publisher !== null && 
           this.publisher.isReady;
  }
}

// Export singleton instance
export const redisBroadcast = new RedisBroadcast();

