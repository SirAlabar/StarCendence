// Redis Publisher - Broadcast game state and events to Redis
import { createClient, RedisClientType } from 'redis';
import { readFileSync } from 'fs';
import { GAME_CONFIG } from '../utils/constants';
import { GameState } from '../types/game.types';
import { GameEvent, RedisChannels } from '../types/event.types';

let redisClient: RedisClientType | null = null;

/**
 * Get Redis password from Docker secret
 */
function getRedisPassword(): string
{
  try
  {
    const password = readFileSync('/run/secrets/redis_password', 'utf-8').trim();
    
    if (!password)
    {
      throw new Error('Redis password is empty!');
    }
    
    return password;
  }
  catch (error)
  {
    console.error('❌ Failed to read Redis password from /run/secrets/redis_password');
    throw error;
  }
}

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<void>
{
  try
  {
    const password = getRedisPassword();

    redisClient = createClient({
      socket: {
        host: GAME_CONFIG.REDIS.HOST,
        port: GAME_CONFIG.REDIS.PORT,
      },
      password: password,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });

    await redisClient.connect();
  }
  catch (error)
  {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void>
{
  if (redisClient)
  {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Publish game state to Redis
 */
export async function publishGameState(gameId: string, state: GameState): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    const channel = RedisChannels.gameUpdates(gameId);
    const message = JSON.stringify({
      channel,
      type: 'state_update',
      gameId,
      timestamp: Date.now(),
      data: state,
    });

    await redisClient.publish(channel, message);
  }
  catch (error)
  {
    console.error('Failed to publish game state:', error);
  }
}

/**
 * Publish game event to Redis
 */
export async function publishGameEvent(event: GameEvent): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    const channel = RedisChannels.gameEvents(event.gameId);
    const message = JSON.stringify({
      channel,
      type: 'event',
      gameId: event.gameId,
      timestamp: event.timestamp,
      data: event,
    });

    await redisClient.publish(channel, message);
  }
  catch (error)
  {
    console.error('Failed to publish game event:', error);
  }
}

/**
 * Subscribe to player input channel
 */
export async function subscribeToPlayerInput(
  gameId: string,
  callback: (playerId: string, input: any) => void
): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    const channel = RedisChannels.gameInput(gameId);
    
    await subscriber.subscribe(channel, (message) => {
      try
      {
        const data = JSON.parse(message);
        if (data.type === 'input' && data.data)
        {
          callback(data.data.playerId, data.data.data);
        }
      }
      catch (error)
      {
        console.error('Failed to parse input message:', error);
      }
    });

    console.log(`Subscribed to player input: ${channel}`);
  }
  catch (error)
  {
    console.error('Failed to subscribe to player input:', error);
  }
}


/**
 * Publish racer game state update to WebSocket clients
 * Uses websocket:broadcast channel so WebSocket service forwards to clients
 */
export async function publishRacerState(
  gameId: string,
  players: any[],
  playerIds?: string[]  // ← Add optional player IDs
): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    // Build message payload
    const statePayload = {
      gameId,
      timestamp: Date.now(),
      players
    };

    // If we have player IDs, send to specific users
    // Otherwise send to everyone (shouldn't happen but fallback)
    const broadcastMessage = playerIds && playerIds.length > 0
      ? {
          userIds: playerIds,  // Send to specific players
          message: {
            type: 'game:racer:state',
            payload: statePayload,
            timestamp: Date.now()
          }
        }
      : {
          message: {
            type: 'game:racer:state',
            payload: statePayload,
            timestamp: Date.now()
          }
        };

    // Publish to websocket:broadcast channel
    await redisClient.publish('websocket:broadcast', JSON.stringify(broadcastMessage));
  }
  catch (error)
  {
    console.error('Failed to publish racer state:', error);
  }
}

/**
 * Publish racer game event
 */
export async function publishRacerEvent(
  gameId: string,
  eventType: string,
  playerId: string,
  data: any
): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    const channel = `game:racer:events:${gameId}`;
    
    const message = JSON.stringify({
      type: eventType,
      gameId,
      playerId,
      timestamp: Date.now(),
      data
    });

    await redisClient.publish(channel, message);
  }
  catch (error)
  {
    console.error('Failed to publish racer event:', error);
  }
}

/**
 * Subscribe to racer player input
 * WebSocket publishes to game:${gameId}:input channel
 */
export async function subscribeToRacerInput(
  gameId: string,
  callback: (playerId: string, input: any) => void
): Promise<void>
{
  if (!redisClient)
  {
    console.error('Redis client not initialized');
    return;
  }

  try
  {
    console.log(`[RedisPublisher] ðŸ"— Creating subscriber for game ${gameId}...`);
    
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    
    console.log(`[RedisPublisher] âœ… Subscriber connected for game ${gameId}`);

    // Match the channel that WebSocket publishes to
    const channel = `game:${gameId}:input`;
    
    console.log(`[RedisPublisher] ðŸ"¡ Subscribing to channel: ${channel}`);
    
    await subscriber.subscribe(channel, (message) => {
      console.log(`[RedisPublisher] ðŸ"¨ RAW MESSAGE RECEIVED on ${channel}:`, message.substring(0, 200));
      
      try
      {
        const data = JSON.parse(message);
        console.log(`[RedisPublisher] ðŸ"¦ Parsed message type: ${data.type}`);
        
        // WebSocket sends: { type: 'game:racer:input', payload: { userId, input } }
        if (data.type === 'game:racer:input' && data.payload)
        {
          const { userId, input } = data.payload;
          console.log(`[RedisPublisher] âœ… Processing input from user ${userId}:`, input);
          
          if (userId && input)
          {
            callback(userId, input);
            console.log(`[RedisPublisher] âœ… Callback executed for user ${userId}`);
          }
          else
          {
            console.warn(`[RedisPublisher] âš ï¸  Missing userId or input in payload:`, data.payload);
          }
        }
        else
        {
          console.warn(`[RedisPublisher] âš ï¸  Unexpected message type or missing payload: ${data.type}`);
        }
      }
      catch (error)
      {
        console.error('[RedisPublisher] âŒ Failed to parse racer input message:', error);
        console.error('[RedisPublisher] âŒ Raw message:', message);
      }
    });

    console.log(`âœ… Subscribed to racer input: ${channel}`);
  }
  catch (error)
  {
    console.error(`[RedisPublisher] âŒ Failed to subscribe to racer input:`, error);
  }
}

/**
 * Get Redis client (for direct access if needed)
 */
export function getRedisClient(): RedisClientType | null
{
  return redisClient;
}