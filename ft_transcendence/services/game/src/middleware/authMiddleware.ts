// Auth Middleware - Verify JWT tokens from auth service
import { FastifyRequest, FastifyReply } from 'fastify';
import { GAME_CONFIG } from '../utils/constants';
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
    const response = await fetch(`${GAME_CONFIG.SERVICES.AUTH}/internal/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getInternalApiKey(),
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok)
    {
      throw unauthorized('Invalid or expired token');
    }

    const verifiedUser = await response.json() as { userId?: string; sub?: string; email?: string };

    // Attach user info to request
    (request as any).user = {
      sub: verifiedUser.userId || verifiedUser.sub,
      email: verifiedUser.email,
    };
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