import { FastifyRequest, FastifyReply } from 'fastify';
import * as tokenService from './tokenService';

interface RefreshTokenRequestBody {
  refreshToken: string;
}

// Refresh access token using refresh token
export async function refreshAccessToken(req: FastifyRequest<{ Body: RefreshTokenRequestBody }>, reply: FastifyReply) {
  const { refreshToken } = req.body;

  const newTokens = await tokenService.refreshAccessToken(refreshToken);

  return reply.send({ 
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken
  });
}