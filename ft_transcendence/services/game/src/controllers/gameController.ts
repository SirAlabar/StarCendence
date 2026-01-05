// Game Controller - API endpoints for game operations
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as gameSessionManager from '../managers/GameSessionManager';
import * as gameRepository from '../repositories/gameRepository';
import { validateGameId, validatePlayerId } from '../utils/validationUtils';
import { verifyUserToken } from '../middleware/authMiddleware';

/**
 * Register game routes
 */
export function registerGameRoutes(fastify: FastifyInstance): void
{
  // Leave game (requires authentication)
  fastify.post<{ Params: { id: string } }>('/games/:id/leave', {
    preHandler: [verifyUserToken],
    handler: leaveGameHandler,
  });

  // Get game state (requires authentication)
  fastify.get<{ Params: { id: string } }>('/games/:id/state', {
    preHandler: [verifyUserToken],
    handler: getGameStateHandler,
  });

  // Get active games (public - no auth required)
  fastify.get('/games/active', getActiveGamesHandler);

  // End game (requires authentication)
  fastify.post<{ Params: { id: string } }>('/games/:id/end', {
    preHandler: [verifyUserToken],
    handler: endGameHandler,
  });
}

/**
 * Leave game
 * POST /games/:id/leave
 */
async function leaveGameHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;
    
    // Get userId from JWT token
    const userId = (request as any).user?.sub;
    if (!userId)
    {
      return reply.code(401).send({ error: 'Unauthorized: Missing authentication' });
    }

    // Validate input
    validateGameId(gameId);
    validatePlayerId(userId);

    // Leave game session
    await gameSessionManager.leaveGameSession(gameId, userId);

    reply.code(200).send({
      success: true,
      message: 'Left game successfully',
    });
  }
  catch (error: any)
  {
    console.error('Error leaving game:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}

/**
 * Get game state
 * GET /games/:id/state
 */
async function getGameStateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;

    // Validate input
    validateGameId(gameId);

    // Get game session
    const session = gameSessionManager.getGameSession(gameId);
    if (!session)
    {
      return reply.code(404).send({ error: 'Game not found' });
    }

    reply.code(200).send({
      success: true,
      game: {
        id: session.game.id,
        type: session.game.type,
        mode: session.game.mode,
        status: session.game.status,
      },
      state: session.state,
      players: Array.from(session.players.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.score,
        isConnected: p.isConnected,
      })),
    });
  }
  catch (error: any)
  {
    console.error('Error getting game state:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}

/**
 * Get active games
 * GET /games/active
 */
async function getActiveGamesHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const games = await gameRepository.getActiveGames();

    reply.code(200).send({
      success: true,
      games: games.map(game => ({
        id: game.id,
        type: game.type,
        mode: game.mode,
        status: game.status,
        currentPlayers: game.players.length,
        maxPlayers: game.maxPlayers,
        createdAt: game.createdAt,
      })),
    });
  }
  catch (error: any)
  {
    console.error('Error getting active games:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}

/**
 * End game
 * POST /games/:id/end
 */
async function endGameHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;

    // Validate input
    validateGameId(gameId);

    // End game session
    await gameSessionManager.endGameSession(gameId);

    reply.code(200).send({
      success: true,
      message: 'Game ended successfully',
    });
  }
  catch (error: any)
  {
    console.error('Error ending game:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}