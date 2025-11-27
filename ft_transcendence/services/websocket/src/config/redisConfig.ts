// Redis configuration
import { createClient, RedisClientType } from 'redis';
import * as fs from 'fs';

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
}

let redisClient: RedisClientType | null = null;

/**
 * Get Redis password from Docker secret or environment variable
 */
function getRedisPassword(): string
{
  // First try to get password from Docker secret file
  try
  {
    const secretPath = '/run/secrets/redis_password';
    if (fs.existsSync(secretPath))
    {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
  }
  catch (error)
  {
    console.warn('Could not read Redis password from Docker secret:', error);
  }

  // If no secret file, use environment variable
  const envPassword = process.env.REDIS_PASSWORD;
  if (envPassword)
  {
    return envPassword;
  }

  // If no password is configured, throw error
  throw new Error('REDIS_PASSWORD not configured. Set it in .env or Docker secret');
}

export function getRedisConfig(): RedisConfig
{
  return {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '23111', 10),
    password: getRedisPassword(),
  };
}

export async function createRedisClient(): Promise<RedisClientType>
{
  if (redisClient && redisClient.isReady)
  {
    return redisClient;
  }

  try
  {
    const config = getRedisConfig();
    
    redisClient = createClient(
    {
      socket:
      {
        host: config.host,
        port: config.port,
        keepAlive: 30000, // 30 seconds
        reconnectStrategy: (retries) =>
        {
          if (retries > 10)
          {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
      password: config.password,
    });

    // Error handling
    redisClient.on('error', (err) =>
    {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () =>
    {
      console.log('Redis client connecting...');
    });

    redisClient.on('ready', () =>
    {
      console.log('Redis client ready');
      // Send ping every 20 seconds to keep connection alive
      setInterval(async () =>
      {
        try
        {
          if (redisClient && redisClient.isReady)
          {
            await redisClient.ping();
          }
        }
        catch (error)
        {
          // If ping fails, don't worry - it will reconnect
        }
      }, 20000);
    });

    redisClient.on('reconnecting', () =>
    {
      console.log('Redis client reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  }
  catch (error)
  {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
}

export async function getRedisClient(): Promise<RedisClientType>
{
  if (!redisClient || !redisClient.isReady)
  {
    return await createRedisClient();
  }
  return redisClient;
}

export async function closeRedisClient(): Promise<void>
{
  if (redisClient && redisClient.isReady)
  {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis client closed');
  }
}

export function isRedisConnected(): boolean
{
  return redisClient !== null && redisClient.isReady;
}

