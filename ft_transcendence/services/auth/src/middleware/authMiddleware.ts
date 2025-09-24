// JWT token validation middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpError } from '../utils/HttpError';
import { verifyAccessToken } from '../services/tokenService';

// Extended request interface to include user data
// declare module 'fastify' {
//   interface FastifyRequest {
//     user?: {
//       sub: string;      // User ID
//       email: string;
//       username: string;
//       type: string;
//       iat?: number;     // Issued at
//       exp?: number;     // Expires at
//       iss?: string;     // Issuer
//     };
//   }
// }

// Authentication middleware - verifies JWT access token
export async function verifyUserToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('Authorization header missing or malformed', 401);
  }
  
  const token = authHeader.substring(7);

  if (!token) {
    throw new HttpError('Access token is required', 401);
  }

  const decoded = await verifyAccessToken(token);
  
   if (decoded.type !== 'access') {
    throw new HttpError('Invalid token type', 401);
  }

  if (!decoded.sub || !decoded.email || !decoded.username) {
    throw new HttpError('Invalid token: missing required fields', 401);
  }

  req.user = decoded;
}
