// redis pub sub for cross server broadcasting
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

export type RedisChannelHandler = (message: any, channel: string) => Promise<void> | void;

export class RedisBroadcast
{
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private readonly channel = 'websocket:broadcast';
  private isSubscribed = false;
  
  // map for handlers channel to message type to handler
  private channelHandlers: Map<string, Map<string, RedisChannelHandler>> = new Map();
  // set of subscribed channels
  private subscribedChannels: Set<string> = new Set();

  async initialize(): Promise<void>
  {
    try
    {
      if (!isRedisConnected())
      {
        await getRedisClient();
      }

  // need two separate clients one to listen one to send
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
        // keepalive ping every 20 seconds for subscriber
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
            // if ping fails ignore reconnect will happen
          }
        }, 20000);
      });

      this.publisher.on('error', (err) =>
      {
        console.error('Redis Publisher Error:', err);
      });

      this.publisher.on('ready', () =>
      {
        // keepalive ping every 20 seconds for publisher
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
            // if ping fails ignore reconnect will happen
          }
        }, 20000);
      });

      // subscribe to broadcast channel
      await this.subscriber.subscribe(this.channel, (message) =>
      {
        this.handleIncomingMessage(message);
      });

      this.isSubscribed = true;
      console.log(`Redis broadcast subscribed to channel: ${this.channel}`);
      
      // Subscribe to test response channel
      await this.subscriber.subscribe('test:response', (message) => {
        console.log('✅ Redis test passed:', message);
      });
      
      // Test Redis pub/sub connection with delay to allow game service to connect
      setTimeout(async () => {
        try {
          if (this.publisher && this.publisher.isReady) {
            await this.publisher.publish('test:channel', 'test');
            console.log('✅ Redis test publish sent');
          }
        } catch (error) {
          console.error('❌ Redis test publish failed:', error);
        }
      }, 2000);
      
      // if handlers were registered before initialize ran subscribe to them now
      for (const preChannel of this.channelHandlers.keys())
      {
        try
        {
          if (!this.subscribedChannels.has(preChannel))
          {
            await this.subscribeToChannel(preChannel);
          }
        }
        catch (err)
        {
          console.error(`Failed to subscribe to pre registered channel ${preChannel}:`, err);
        }
      }
    }
    catch (error)
    {
      console.error('Failed to initialize Redis broadcast:', error);
      throw error;
    }
  }

  // handle incoming message from redis pub sub
  private handleIncomingMessage(message: string): void
  {
    try
    {
      const broadcastMessage: BroadcastMessage = JSON.parse(message);

      // skip messages we sent ourselves
      if (broadcastMessage.targetUserId)
      {
        // send to one user
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
        // send to everyone
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
        console.warn('redis publisher not ready skip broadcast');
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

  async publishToChannel(channel: string, message: any): Promise<void>
  {
    try
    {
      if (!this.publisher || !this.publisher.isReady)
      {
        console.warn('redis publisher not ready skip publish');
        return;
      }

      const messageStr = JSON.stringify(message);
      await this.publisher.publish(channel, messageStr);
    }
    catch (error)
    {
      console.error(`Error publishing to channel ${channel}:`, error);
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

  async subscribeToChannel(channel: string): Promise<void>
  {
    try
    {
      if (!this.subscriber || !this.subscriber.isReady)
      {
        console.warn('redis subscriber not ready cannot subscribe');
        return;
      }

      // if already subscribed do nothing
      if (this.subscribedChannels.has(channel))
      {
        return;
      }

      await this.subscriber.subscribe(channel, (message: string) =>
      {
        // forward message to handler handleChannelMessage is async
        this.handleChannelMessage(channel, message);
      });


      this.subscribedChannels.add(channel);
      console.log(`Redis subscribed to channel: ${channel}`);
    }
    catch (error)
    {
      console.error(`Error subscribing to channel ${channel}:`, error);
    }
  }

  async registerChannelHandler(channel: string, messageType: string, handler: RedisChannelHandler): Promise<void>
  {
    // ensure handler map exists for channel
    if (!this.channelHandlers.has(channel))
    {
      this.channelHandlers.set(channel, new Map());
    }

    // register the handler
    this.channelHandlers.get(channel)!.set(messageType, handler);
    console.log(`Registered handler for channel ${channel} message type ${messageType}`);
  }

  async unregisterChannelHandler(channel: string, messageType?: string): Promise<void>
  {
    if (!this.channelHandlers.has(channel))
    {
      return;
    }

    const channelHandlerMap = this.channelHandlers.get(channel)!;

      if (messageType)
      {
        // remove specific handler
        channelHandlerMap.delete(messageType);
        
        // if no handlers left remove channel
        if (channelHandlerMap.size === 0)
        {
          this.channelHandlers.delete(channel);
          await this.unsubscribeFromChannel(channel);
        }
      }
      else
      {
        // remove all handlers for channel
        this.channelHandlers.delete(channel);
        await this.unsubscribeFromChannel(channel);
      }
  }

  async unsubscribeFromChannel(channel: string): Promise<void>
  {
    try
    {
      if (!this.subscriber || !this.subscriber.isReady)
      {
        return;
      }

      if (this.subscribedChannels.has(channel))
      {
        await this.subscriber.unsubscribe(channel);
        this.subscribedChannels.delete(channel);
        console.log(`Redis unsubscribed from channel: ${channel}`);
      }
    }
    catch (error)
    {
      console.error(`Error unsubscribing from channel ${channel}:`, error);
    }
  }

  private async handleChannelMessage(channel: string, rawMessage: string): Promise<void>
  {
    try
    {
      const message = JSON.parse(rawMessage);

      const channelHandlerMap = this.channelHandlers.get(channel);
      if (!channelHandlerMap)
      {
        console.warn(`No handlers registered for channel: ${channel}`);
        return;
      }

      // Check for wildcard handler first ('*')
      const wildcardHandler = channelHandlerMap.get('*');
      if (wildcardHandler)
      {
        await wildcardHandler(message, channel);
        return;
      }

      // Otherwise check for specific message type handler
      const messageType = message.type;
      if (!messageType)
      {
        console.warn(`Message from channel ${channel} has no type field`);
        return;
      }

      const handler = channelHandlerMap.get(messageType);
      if (handler)
      {
        await handler(message, channel);
      }
      else
      {
        console.warn(`No handler registered for channel ${channel}, message type ${messageType}`);
      }
    }
    catch (error)
    {
      console.error(`Error handling message from channel ${channel}:`, error);
    }
  }

  getPublisher(): RedisClientType | null
  {
    return this.publisher;
  }

  getSubscriber(): RedisClientType | null
  {
    return this.subscriber;
  }

  async shutdown(): Promise<void>
  {
    try
    {
      // Unsubscribe de canais customizados
      for (const channel of this.subscribedChannels)
      {
        if (this.subscriber && this.subscriber.isReady)
        {
          await this.subscriber.unsubscribe(channel);
        }
      }
      this.subscribedChannels.clear();
      this.channelHandlers.clear();

      // Unsubscribe do canal principal
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

