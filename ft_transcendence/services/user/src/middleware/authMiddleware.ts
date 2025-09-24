import {FastifyReply, FastifyRequest} from "fastify";
import {readFileSync} from "fs";
import {HttpError} from "../utils/HttpError";

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

// Get internal API key from Docker secret
function getInternalApiKey(): string {
	const apiKey: string = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
	if (!apiKey) {
		throw new HttpError('Internal API key is not configured', 500);
	}
  return apiKey;
}

// user/src/middleware/authMiddleware.ts
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
    return reply.status(401).send({ error: 'Invalid token or API key' });
  }

  const data = await response.json();
  req.user = data.user;
}