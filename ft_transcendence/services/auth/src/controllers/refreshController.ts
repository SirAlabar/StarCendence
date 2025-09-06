// Token refresh endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';
import * as tokenService from '../services/tokenService';

interface RefreshTokenRequestBody {
  refreshToken: string;
}

// Refresh access token using refresh token
export async function refreshAccessToken(req: FastifyRequest<{ Body: RefreshTokenRequestBody }>, reply: FastifyReply) {
  const { refreshToken } = req.body;

  const newTokens = await tokenService.refreshAccessToken(refreshToken);

  return reply.send({ 
    success: true,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken
  });
}
