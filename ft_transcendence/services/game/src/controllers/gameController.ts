// Game Controller - API endpoints for game operations
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameType, GameMode } from '../utils/constants';
import * as gameSessionManager from '../managers/GameSessionManager';
import * as gameRepository from '../repositories/gameRepository';
import { validateGameId, validatePlayerId } from '../utils/validationUtils';
import { verifyUserToken } from '../middleware/authMiddleware';

/**
 * Register game routes
 */
export function registerGameRoutes(fastify: FastifyInstance): void
{
  // Create new game (requires authentication)
  fastify.post<{ Body: CreateGameBody }>('/games/create', {
    preHandler: [verifyUserToken],
    handler: createGameHandler,
  });

  // Join game (requires authentication)
  fastify.post<{ Params: { id: string } }>('/games/:id/join', {
    preHandler: [verifyUserToken],
    handler: joinGameHandler,
  });

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
 * Create new game
 * POST /games/create
 */
interface CreateGameBody
{
  type: GameType;
  mode: GameMode;
  maxPlayers?: number;
  maxScore?: number;
}

async function createGameHandler(
  request: FastifyRequest<{ Body: CreateGameBody }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { type, mode, maxPlayers = 2, maxScore = 5 } = request.body;

    // Validate input
    if (!type || !Object.values(GameType).includes(type))
    {
      return reply.code(400).send({ error: 'Invalid game type' });
    }

    if (!mode || !Object.values(GameMode).includes(mode))
    {
      return reply.code(400).send({ error: 'Invalid game mode' });
    }

    // Create game session
    const { game, gameId } = await gameSessionManager.createGameSession({
      type,
      mode,
      maxPlayers,
      maxScore,
    });

    reply.code(201).send({
      success: true,
      gameId,
      game: {
        id: game.id,
        type: game.type,
        mode: game.mode,
        status: game.status,
        maxPlayers: game.maxPlayers,
        currentPlayers: 0,
        maxScore: game.maxScore,
      },
    });
  }
  catch (error: any)
  {
    console.error('Error creating game:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}

/**
 * Join game
 * POST /games/:id/join
 */
async function joinGameHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;
    
    // Get userId from JWT token (set by auth middleware)
    const userId = (request as any).user?.sub;
    if (!userId)
    {
      return reply.code(401).send({ error: 'Unauthorized: Missing authentication' });
    }

    // Validate input
    validateGameId(gameId);
    validatePlayerId(userId);

    // Join game session
    const result = await gameSessionManager.joinGameSession(gameId, userId);

    // Get updated game with players count
    const gameWithPlayers = await gameRepository.getGameById(gameId);
    const currentPlayers = gameWithPlayers?.players.length || 0;

    reply.code(200).send({
      success: true,
      playerRole: result.playerRole,
      game: {
        id: result.game.id,
        type: result.game.type,
        mode: result.game.mode,
        status: result.game.status,
        currentPlayers,
        maxPlayers: result.game.maxPlayers,
      },
    });
  }
  catch (error: any)
  {
    console.error('Error joining game:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
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
        role: p.role,
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