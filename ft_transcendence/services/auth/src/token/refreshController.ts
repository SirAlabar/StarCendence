import { FastifyRequest, FastifyReply } from 'fastify';
import * as tokenService from './tokenService';

// Refresh access token using refresh token
export async function refreshAccessToken(req: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    return reply.status(400).send({ error: 'Refresh token is required' });
  }

  const newTokens = await tokenService.refreshAccessToken(refreshToken);

  return reply.send({ 
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken
  });
}
