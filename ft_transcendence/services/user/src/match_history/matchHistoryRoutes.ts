import { FastifyInstance } from "fastify";
import * as matchHistoryController from './matchHistoryController';
import * as matchHistorySchema from './matchHistorySchema';

export async function matchHistoryRoutes(fastify: FastifyInstance) {
  fastify.post('/internal/match-history/create',
  {
    schema: matchHistorySchema.createMatchHistorySchema
  },
  matchHistoryController.createMatchHistory)
}
