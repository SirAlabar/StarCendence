import { readFileSync } from 'fs';
import { HttpError } from './HttpError';

/**
 * Reads a secret from Docker secrets
 * Secrets are mounted at /run/secrets/{secret_name}
 */
export function getDockerSecret(secretName: string): string
{
  try
  {
    const secretPath = `/run/secrets/${secretName}`;
    const secret = readFileSync(secretPath, 'utf8').trim();
    
    if (!secret)
    {
      throw new HttpError(`Docker secret '${secretName}' is empty`, 500);
    }
    
    return secret;
  }
  catch (error)
  {
    if (error instanceof HttpError)
    {
      throw error;
    }
    throw new HttpError(`Failed to read Docker secret '${secretName}': ${error}`, 500);
  }
}

/**
 * Gets the internal API key for service-to-service communication
 */
export function getInternalApiKey(): string
{
  return getDockerSecret('internal_api_key');
}

/**
 * Validates that required secrets are available
 */
export function validateSecrets(): void
{
  const requiredSecrets = ['internal_api_key'];
  
  for (const secret of requiredSecrets)
  {
    try
    {
      getDockerSecret(secret);
    }
    catch (error)
    {
      console.error(`Missing required secret: ${secret}`);
      throw error;
    }
  }
  
  console.log('✅ All required secrets validated');
}

// Get Metrics User from Docker secret
export function getMetricsUser(): string {
  const metricsUser: string = readFileSync('/run/secrets/metrics_user', 'utf8').trim();
  if (!metricsUser) {
    throw new HttpError('Metrics User is not configured', 500);
  }
  return metricsUser;
}

// Get Metrics Password from Docker secret
export function getMetricsPass(): string {
  const metricsPass: string = readFileSync('/run/secrets/metrics_pass', 'utf8').trim();
  if (!metricsPass) {
    throw new HttpError('Metrics Password is not configured', 500);
  }
  return metricsPass;
}