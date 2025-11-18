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

export class RedisBroadcast
{
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private readonly channel = 'websocket:broadcast';
  private isSubscribed = false;

  async initialize(): Promise<void>
  {
    try
    {
      if (!isRedisConnected())
      {
        await getRedisClient();
      }

      // Need two separate connections: one to listen, one to send
      const { getRedisConfig } = await import('../config/redisConfig');
      const redisConfig = getRedisConfig();
      const { createClient } = await import('redis');
      
      this.subscriber = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          keepAlive: 30000, // 30 seconds
          reconnectStrategy: (retries) =>
          {
            if (retries > 10)
            {
              console.error('Redis Subscriber: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            return delay;
          },
        },
        password: redisConfig.password,
      }) as RedisClientType;

      this.publisher = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          keepAlive: 30000, // 30 seconds
          reconnectStrategy: (retries) =>
          {
            if (retries > 10)
            {
              console.error('Redis Publisher: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            return delay;
          },
        },
        password: redisConfig.password,
      }) as RedisClientType;

      // Connect both clients
      await this.subscriber.connect();
      await this.publisher.connect();

      // Setup subscriber event handlers
      this.subscriber.on('error', (err) =>
      {
        console.error('Redis Subscriber Error:', err);
      });

      this.subscriber.on('ready', () =>
      {
        // Keepalive ping every 20 seconds for subscriber
        setInterval(async () =>
        {
          try
          {
            if (this.subscriber && this.subscriber.isReady)
            {
              await this.subscriber.ping();
            }
          }
          catch (error)
          {
            // If ping fails, don't worry - it will reconnect
          }
        }, 20000);
      });

      this.publisher.on('error', (err) =>
      {
        console.error('Redis Publisher Error:', err);
      });

      this.publisher.on('ready', () =>
      {
        // Keepalive ping every 20 seconds for publisher
        setInterval(async () =>
        {
          try
          {
            if (this.publisher && this.publisher.isReady)
            {
              await this.publisher.ping();
            }
          }
          catch (error)
          {
            // If ping fails, don't worry - it will reconnect
          }
        }, 20000);
      });

      // Subscribe to broadcast channel
      await this.subscriber.subscribe(this.channel, (message) =>
      {
        this.handleIncomingMessage(message);
      });

      this.isSubscribed = true;
      console.log(`Redis broadcast subscribed to channel: ${this.channel}`);
    }
    catch (error)
    {
      console.error('Failed to initialize Redis broadcast:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message from Redis pub/sub
   */
  private handleIncomingMessage(message: string): void
  {
    try
    {
      const broadcastMessage: BroadcastMessage = JSON.parse(message);

      // Skip messages we sent ourselves
      if (broadcastMessage.targetUserId)
      {
        // Send to one user
        const connections = connectionPool.getConnectionsByUserId(broadcastMessage.targetUserId);
        
        for (const connection of connections)
        {
          try
          {
            if (connection.socket.readyState === 1) // WebSocket.OPEN
            {
              const wsMessage: WebSocketMessage = {
                type: broadcastMessage.type,
                payload: broadcastMessage.payload,
                timestamp: broadcastMessage.timestamp || Date.now(),
              };
              connection.socket.send(JSON.stringify(wsMessage));
            }
          }
          catch (error)
          {
            console.error(`Error sending message to connection ${connection.connectionId}:`, error);
          }
        }
      }
      else
      {
        // Send to everyone
        const allConnections = connectionPool.getAll();
        
        for (const connection of allConnections)
        {
          try
          {
            if (connection.socket.readyState === 1) // WebSocket.OPEN
            {
              const wsMessage: WebSocketMessage = {
                type: broadcastMessage.type,
                payload: broadcastMessage.payload,
                timestamp: broadcastMessage.timestamp || Date.now(),
              };
              connection.socket.send(JSON.stringify(wsMessage));
            }
          }
          catch (error)
          {
            console.error(`Error sending message to connection ${connection.connectionId}:`, error);
          }
        }
      }
    }
    catch (error)
    {
      console.error('Error handling Redis broadcast message:', error);
    }
  }

  async publish(message: BroadcastMessage): Promise<void>
  {
    try
    {
      if (!this.publisher || !this.publisher.isReady)
      {
        console.warn('Redis publisher not ready, skipping broadcast');
        return;
      }

      const messageStr = JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now(),
      });

      await this.publisher.publish(this.channel, messageStr);
    }
    catch (error)
    {
      console.error('Error publishing to Redis:', error);
    }
  }

  async broadcastToUser(userId: string, type: string, payload: any): Promise<void>
  {
    await this.publish({
      type,
      payload,
      targetUserId: userId,
    });
  }

  async broadcastToAll(type: string, payload: any): Promise<void>
  {
    await this.publish({
      type,
      payload,
    });
  }

  async shutdown(): Promise<void>
  {
    try
    {
      if (this.isSubscribed && this.subscriber)
      {
        await this.subscriber.unsubscribe(this.channel);
        this.isSubscribed = false;
      }

      if (this.subscriber && this.subscriber.isReady)
      {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      if (this.publisher && this.publisher.isReady)
      {
        await this.publisher.quit();
        this.publisher = null;
      }

      console.log('Redis broadcast shutdown complete');
    }
    catch (error)
    {
      console.error('Error shutting down Redis broadcast:', error);
    }
  }

  isInitialized(): boolean
  {
    return this.isSubscribed && 
           this.subscriber !== null && 
           this.subscriber.isReady &&
           this.publisher !== null && 
           this.publisher.isReady;
  }
}

// Export singleton instance
export const redisBroadcast = new RedisBroadcast();

