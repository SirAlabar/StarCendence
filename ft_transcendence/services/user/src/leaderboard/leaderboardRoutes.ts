import { FastifyInstance } from 'fastify';
import * as leaderboardController from './leaderboardController';
import { getLeaderboardSchema } from './leaderboardSchema';

export async function leaderboardRoutes(fastify: FastifyInstance) 
{
  // GET /leaderboard - Get top 20 players
  fastify.get('/leaderboard',
  {
    schema: getLeaderboardSchema
  },
  leaderboardController.getLeaderboard);
}
