// Redis Publisher - Broadcast game state and events to Redis
import { createClient, RedisClientType } from 'redis';
import { readFileSync } from 'fs';

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
        host: "redis",
        port: 23111,
      },
      password: password,
    });

    redisClient.on('error', (err : any) => {
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


/**
/**
 * Get Redis client (for direct access if needed)
 */
export function getRedisClient(): RedisClientType | null
{
  return redisClient;
}