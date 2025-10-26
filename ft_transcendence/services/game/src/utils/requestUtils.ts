import { FastifyRequest, FastifyReply } from 'fastify';
import { getInternalApiKey } from '../utils/secretsUtils';
import { HttpError } from '../utils/HttpError';

/**
 * Middleware to protect internal endpoints
 * Validates the x-api-key header against the internal API key
 */
export async function internalEndpointProtection( request: FastifyRequest,
  _reply: FastifyReply): Promise<void>
{
  // Check if request is coming from internal network
  if (!request.url.startsWith('/internal/'))
  {
    return; // Not an internal endpoint
  }

  // Read API key from Docker secret
  const expectedApiKey = getInternalApiKey();

  if (!expectedApiKey)
  {
    throw new HttpError('Internal server error: API key not configured', 500);
  }

  // Get API key from request header
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey || apiKey !== expectedApiKey)
  {
    throw new HttpError('Forbidden: Invalid API key', 403);
  }
}
