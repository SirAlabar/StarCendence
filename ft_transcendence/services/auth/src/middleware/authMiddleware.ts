// JWT token validation middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpError } from '../utils/HttpError';
import { verifyAccessToken } from '../token/tokenService';
import { AccessTokenPayload } from '../types/fastify';


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

  const decoded = await verifyAccessToken(token) as AccessTokenPayload;

  if (!decoded.sub || !decoded.email || !decoded.username || decoded.type !== 'access') {
    throw new HttpError('Invalid token: missing required fields', 401);
  }

  req.user = decoded;
}
