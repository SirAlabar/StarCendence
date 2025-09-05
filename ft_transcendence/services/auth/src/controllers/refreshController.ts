// Token refresh endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';
import * as sessionService from '../services/sessionService';
import { HttpError } from '../utils/HttpError';

export const refreshTokenSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { 
        type: 'string',
        minLength: 1
      }
    }
  }
};

interface RefreshTokenRequestBody {
  refreshToken: string;
}

// Refresh access token using refresh token
export async function refreshAccessToken(req: FastifyRequest<{ Body: RefreshTokenRequestBody }>, reply: FastifyReply) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new HttpError('Refresh token is required', 400);
  }

  const newTokens = await sessionService.refreshAccessToken(refreshToken);

  return reply.send({ 
    success: true,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken
  });
}

// Get user's active sessions
export async function getUserSessions(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = req.params;

  if (!userId) {
    throw new HttpError('User ID is required', 400);
  }

  const sessions = await sessionService.getUserSessions(userId);

  return reply.send({ 
    success: true,
    sessions: sessions.map((session: any) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      // Don't return the actual token for security
    }))
  });
}
