import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpError } from '../utils/HttpError';
import { verifyAccessToken } from '../services/tokenService';

export async function tokenVerify(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('Authorization header is required', 401);
  }

  const token = authHeader.substring(7);
  if (!token) {
    throw new HttpError('Access token is required', 401);
  }

  const decoded = await verifyAccessToken(token);

  if (!decoded.sub || !decoded.email || !decoded.username || decoded.type !== 'access') {
    throw new HttpError('Invalid token: missing required fields', 401);
  }

  return reply.send({
    valid: true,
    user: {
      sub: decoded.sub,
      email: decoded.email,
      username: decoded.username,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss
    }
  });
}