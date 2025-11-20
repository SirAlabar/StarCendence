import { FastifyRequest, FastifyReply } from 'fastify';
import * as leaderboardService from './leaderboardService';

// GET /leaderboard - Get top players
export async function getLeaderboard(req: FastifyRequest, reply: FastifyReply)
{
  const leaderboard = await leaderboardService.getLeaderboard();
  if (!leaderboard) {
    return reply.status(404).send({ error: 'Leaderboard not found' });
  }
  return reply.send(leaderboard);
}
