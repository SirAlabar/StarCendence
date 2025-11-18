// Auth Middleware - Verify JWT tokens from auth service
import { FastifyRequest, FastifyReply } from 'fastify';
import { getInternalApiKey } from '../utils/secretsUtils';
import { unauthorized } from '../utils/HttpError';

/**
 * Verify user JWT token
 * Extracts token from Authorization header and verifies with auth service
 */
export async function verifyUserToken(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void>
{
  try
  {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
    {
      throw unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with auth service
    const response = await fetch('http://auth-service:3001/internal/token/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': getInternalApiKey(),
      },
    });

    if (!response.ok)
    {
      throw unauthorized('Invalid or expired token');
    }

    const data = await response.json() as { user?: any };

    // Attach user info to request
    (request as any).user = data.user;
  }
  catch (error: any)
  {
    if (error.statusCode === 401)
    {
      throw error;
    }
    console.error('Token verification error:', error);
    throw unauthorized('Token verification failed');
  }
}