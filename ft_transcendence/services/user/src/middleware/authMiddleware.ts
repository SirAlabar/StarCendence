import {FastifyReply, FastifyRequest} from "fastify";

// Extend Fastify request interface
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

// user/src/middleware/authMiddleware.ts
export async function authenticateToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);
  
  // Call auth service's /verify endpoint
  const response = await fetch('http://auth-service:3001/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    return reply.status(401).send({ error: 'Invalid token' });
  }

  const data = await response.json();
  req.user = data.user;
}