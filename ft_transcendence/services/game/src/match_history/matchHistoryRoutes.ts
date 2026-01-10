import { FastifyInstance } from "fastify";
import { verifyUserToken } from '../middleware/authMiddleware';
import * as matchHistoryController from './matchHistoryController';

export async function matchHistoryRoutes(fastify: FastifyInstance) {
  fastify.get('/match-history',
  {
    preHandler: [verifyUserToken],
  },
  matchHistoryController.getMatchHistory)
}
