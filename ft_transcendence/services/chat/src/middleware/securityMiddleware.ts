import { FastifyRequest, FastifyReply } from 'fastify';
import { getInternalApiKey } from '../utils/getSecrets';
import { HttpError } from '../utils/HttpError';


// Middleware to protect internal endpoints
export async function internalEndpointProtection(request: FastifyRequest, reply: FastifyReply) {
  if (request.url.startsWith('/internal/')) {
    
    const expectedApiKey = getInternalApiKey();

    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new HttpError('Forbidden: Invalid API key', 403);
    }
  }
}
