import { FastifyInstance } from "fastify";
import { verifyUserToken } from '../middleware/authMiddleware';
import * as matchHistoryController from './matchHistoryController';
import * as matchHistorySchema from './matchHistorySchema';

export async function matchHistoryRoutes(fastify: FastifyInstance) {
  fastify.post('/internal/match-history/create',
  {
    schema: matchHistorySchema.createMatchHistorySchema
  },
  matchHistoryController.createMatchHistory)

  fastify.get('/match-history',
  {
    preHandler: [verifyUserToken],
  },
  matchHistoryController.getMatchHistories)

  fastify.get('/match-history/:id',
  {
    preHandler: [verifyUserToken],
  },
  matchHistoryController.getMatchHistoryById)
}

