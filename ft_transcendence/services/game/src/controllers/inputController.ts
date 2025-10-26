// Input Controller - Handle paddle positions and score events from clients
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateGameId, validatePlayerId } from '../utils/validationUtils';
import { publishGameEvent } from '../communication/RedisPublisher';
import { sessionStore } from '../managers/SessionStore';
import { verifyUserToken } from '../middleware/authMiddleware';

/**
 * Register input routes
 */
export function registerInputRoutes(fastify: FastifyInstance): void
{
  // Send paddle position (requires authentication)
  fastify.post<{ Params: { id: string }; Body: PaddlePositionBody }>('/games/:id/input/paddle', {
    preHandler: [verifyUserToken],
    handler: sendPaddlePositionHandler,
  });

  // Send score event (requires authentication)
  fastify.post<{ Params: { id: string }; Body: ScoreEventBody }>('/games/:id/input/score', {
    preHandler: [verifyUserToken],
    handler: sendScoreEventHandler,
  });
}

/**
 * Send paddle position
 * POST /games/:id/input/paddle
 */
interface PaddlePositionBody
{
  paddleY: number;
}

async function sendPaddlePositionHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: PaddlePositionBody }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;
    const { paddleY } = request.body;
    
    // Get playerId from JWT token
    const playerId = (request as any).user?.sub;
    if (!playerId)
    {
      return reply.code(401).send({ error: 'Unauthorized: Missing authentication' });
    }

    // Validate input
    validateGameId(gameId);
    validatePlayerId(playerId);

    if (typeof paddleY !== 'number' || paddleY < 0)
    {
      return reply.code(400).send({ error: 'Invalid paddle position' });
    }

    // Check session exists
    const session = sessionStore.get(gameId);
    if (!session)
    {
      return reply.code(404).send({ error: 'Game not found' });
    }

    // Relay paddle position to other players via Redis
    await publishGameEvent({
      gameId,
      type: 'PADDLE_UPDATE' as any, // Custom event type
      timestamp: Date.now(),
      data: {
        playerId,
        paddleY,
      },
    });

    reply.code(200).send({ success: true });
  }
  catch (error: any)
  {
    console.error('Error sending paddle position:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}

/**
 * Send score event
 * POST /games/:id/input/score
 */
interface ScoreEventBody
{
  scoringPlayerId: string;
  newScore: number;
}

async function sendScoreEventHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: ScoreEventBody }>,
  reply: FastifyReply
): Promise<void>
{
  try
  {
    const { id: gameId } = request.params;
    const { scoringPlayerId, newScore } = request.body;
    
    // Get playerId from JWT token (player reporting the score)
    const playerId = (request as any).user?.sub;
    if (!playerId)
    {
      return reply.code(401).send({ error: 'Unauthorized: Missing authentication' });
    }

    // Validate input
    validateGameId(gameId);
    validatePlayerId(playerId);
    validatePlayerId(scoringPlayerId);

    if (typeof newScore !== 'number' || newScore < 0)
    {
      return reply.code(400).send({ error: 'Invalid score' });
    }

    // Check session exists
    const session = sessionStore.get(gameId);
    if (!session)
    {
      return reply.code(404).send({ error: 'Game not found' });
    }

    // Get scoring player
    const scoringPlayer = session.players.get(scoringPlayerId);
    if (!scoringPlayer)
    {
      return reply.code(404).send({ error: 'Player not found' });
    }

    // Validate score increment (anti-cheat)
    const expectedScore = scoringPlayer.score + 1;
    if (newScore !== expectedScore)
    {
      console.warn(`⚠️ Invalid score from ${playerId}: expected ${expectedScore}, got ${newScore}`);
      return reply.code(400).send({ error: 'Invalid score increment' });
    }

    // Update score
    scoringPlayer.score = newScore;
    
    // Update session scores array
    const playerIndex = Array.from(session.players.keys()).indexOf(scoringPlayerId);
    if (playerIndex !== -1)
    {
      session.state.scores[playerIndex] = newScore;
    }

    // Broadcast validated score event
    await publishGameEvent({
      gameId,
      type: 'PONG_SCORED' as any,
      timestamp: Date.now(),
      data: {
        scored: {
          playerId: scoringPlayerId,
          newScore,
          totalScore: session.state.scores,
        },
      },
    });

    // Check if game should end
    const maxScore = session.game.maxScore || 5;
    const shouldEnd = newScore >= maxScore;

    reply.code(200).send({
      success: true,
      scoreAccepted: true,
      gameEnded: shouldEnd,
      finalScores: shouldEnd ? session.state.scores : undefined,
    });

    // End game if max score reached
    if (shouldEnd)
    {
      const { endGameSession } = await import('../managers/GameSessionManager');
      await endGameSession(gameId);
    }
  }
  catch (error: any)
  {
    console.error('Error sending score event:', error);
    reply.code(error.statusCode || 500).send({ error: error.message });
  }
}