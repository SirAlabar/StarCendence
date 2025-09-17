// JWT token validation middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpError } from '../utils/HttpError';
import { getInternalApiKey } from '../clients/userServiceClient';

// Extended request interface to include user data
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;      // User ID
      email: string;
      username: string;
      type: string;
      iat?: number;     // Issued at
      exp?: number;     // Expires at
      iss?: string;     // Issuer
    };
  }
}

// Authentication middleware - verifies JWT access token
export async function authenticateToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('Authorization header missing or malformed', 401);
  }
  
  const token = authHeader.substring(7);

  if (!token) {
    throw new HttpError('Token not provided', 401);
  }

  const response = await fetch('http://auth:3000/internal/token/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': getInternalApiKey()
    }
  });
  
  if (!response.ok) {
    throw new HttpError('Invalid or expired token', 401);
  }

  const data = await response.json();
  req.user = data;
}
