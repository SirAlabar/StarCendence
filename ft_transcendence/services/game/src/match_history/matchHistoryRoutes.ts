import { FastifyInstance } from "fastify";
import { verifyUserToken } from '../middleware/authMiddleware';
import * as matchHistoryController from './matchHistoryController';
import * as matchHistorySchema from './matchHistorySchema';

export async function matchHistoryRoutes(fastify: FastifyInstance) {
  fastify.get('/match-history',
  {
    preHandler: [verifyUserToken],
  },
  matchHistoryController.getMatchHistory)

  fastify.get('/match-history/:id',
  {
    preHandler: [verifyUserToken],
    schema: matchHistorySchema.getMatchHistoryByIdSchema
  },
  matchHistoryController.getMatchHistoryById)
}
