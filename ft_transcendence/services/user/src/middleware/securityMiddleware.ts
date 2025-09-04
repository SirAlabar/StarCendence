// Middleware for User Service security
import { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync } from 'fs';
import { HttpError } from '../utils/HttpError';

export async function internalEndpointProtection(request: FastifyRequest, reply: FastifyReply) {
  if (request.url.startsWith('/internal/')) {
    
    // Read API key from Docker secret
    const expectedApiKey = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
    
    if (!expectedApiKey) {
      throw new HttpError('Internal server error: API key not configured', 500);
    }
    
    const apiKey = request.headers['x-api-key'] as string;
    
    if (!apiKey || apiKey !== expectedApiKey) {
      throw new HttpError('Forbidden: Invalid API key', 403);
    }
  }
}
