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
function getRedisPassword(): string {
  // Try Docker secret first (production)
  try {
    const secretPath = '/run/secrets/redis_password';
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
  } catch (error) {
    console.warn('Could not read Redis password from Docker secret:', error);
  }

  // Fallback to environment variable (development)
  const envPassword = process.env.REDIS_PASSWORD;
  if (envPassword) {
    return envPassword;
  }

  // If no password is configured, throw error
  throw new Error('REDIS_PASSWORD not configured. Set it in .env or Docker secret');
}

/**
 * Get Redis configuration
 */
export function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: getRedisPassword(),
  };
}

/**
 * Create and configure Redis client
 */
export async function createRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  try {
    const config = getRedisConfig();
    
    redisClient = createClient({
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password,
    });

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
}

/**
 * Get existing Redis client or create new one
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isReady) {
    return await createRedisClient();
  }
  return redisClient;
}

/**
 * Close Redis client connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isReady) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis client closed');
  }
}

/**
 * Check if Redis client is connected
 */
export function isRedisConnected(): boolean {
  return redisClient !== null && redisClient.isReady;
}

