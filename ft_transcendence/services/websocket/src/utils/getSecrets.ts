import { readFileSync } from 'fs';

export class SecretError extends Error
{
    constructor(message: string)
    {
        super(message);
        this.name = 'SecretError';
    }
}

// Get internal API key from Docker secret
export function getInternalApiKey(): string
{
    try
    {
        const apiKey: string = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
        if (!apiKey)
        {
            throw new SecretError('Internal API key is not configured');
        }
        return apiKey;
    }
    catch (error)
    {
        throw new SecretError(`Failed to read internal API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Get JWT secret from Docker secret file
export function getJwtSecret(): string
{
    try
    {
        const jwtSecret: string = readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
        if (!jwtSecret)
        {
            throw new SecretError('JWT secret is not configured');
        }
        return jwtSecret;
    }
    catch (error)
    {
        throw new SecretError(`Failed to read JWT secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Get Redis password from Docker secret
export function getRedisPassword(): string
{
    try
    {
        const password: string = readFileSync('/run/secrets/redis_password', 'utf8').trim();
        if (!password)
        {
            throw new SecretError('Redis password is not configured');
        }
        return password;
    }
    catch (error)
    {
        throw new SecretError(`Failed to read Redis password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Get Metrics User from Docker secret
export function getMetricsUser(): string {
  const metricsUser: string = readFileSync('/run/secrets/metrics_user', 'utf8').trim();
  if (!metricsUser) {
    throw new SecretError('Metrics User is not configured');
  }
  return metricsUser;
}

// Get Metrics Password from Docker secret
export function getMetricsPass(): string {
  const metricsPass: string = readFileSync('/run/secrets/metrics_pass', 'utf8').trim();
  if (!metricsPass) {
    throw new SecretError('Metrics Password is not configured');
  }
  return metricsPass;
}