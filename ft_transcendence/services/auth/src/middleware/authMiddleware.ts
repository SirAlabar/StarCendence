// JWT token validation middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import * as tokenService from '../services/tokenService';
import { HttpError } from '../utils/HttpError';

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
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new HttpError('Authorization header is required', 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new HttpError('Authorization header must start with "Bearer "', 401);
  }

  const token = authHeader.substring(7);
  
  if (!token) {
    throw new HttpError('Access token is required', 401);
  }

  // 2. Verify the JWT token
  const decoded = await tokenService.verifyAccessToken(token);

  // 3. Validate token type (should be 'access')
  if (decoded.type !== 'access') {
    throw new HttpError('Invalid token type', 401);
  }

  // 4. Validate required fields
  if (!decoded.sub || !decoded.email || !decoded.username) {
    throw new HttpError('Invalid token: missing required fields', 401);
  }

  // 5. Add user data to request for use in route handlers
  req.user = {
    sub: decoded.sub,
    email: decoded.email,
    username: decoded.username,
    type: decoded.type,
    iat: decoded.iat,
    exp: decoded.exp,
    iss: decoded.iss
  };
}
