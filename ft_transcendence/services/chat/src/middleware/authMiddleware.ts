// JWT token validation middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { getInternalApiKey } from '../utils/getSecrets';


// Middleware to verify token
export async function verifyUserToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);

  // Call auth service's /internal/token/verify endpoint
  const response = await fetch('http://auth-service:3001/internal/token/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': getInternalApiKey()
    }
  });

  if (!response.ok) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const data = await response.json();
  req.user = data.user;
}