// Redis Publisher - Broadcast game state and events to Redis
import { createClient, RedisClientType } from 'redis';
import { GAME_CONFIG } from '../utils/constants';
import { GameState } from '../types/game.types';
import { GameEvent, RedisChannels } from '../types/event.types';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<void>
{
  try
  {
    redisClient = createClient({
      socket: {
        host: GAME_CONFIG.REDIS.HOST,
        port: GAME_CONFIG.REDIS.PORT,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
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
 * Get Redis client (for direct access if needed)
 */
export function getRedisClient(): RedisClientType | null
{
  return redisClient;
}