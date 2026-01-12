import { FastifyReply, FastifyRequest } from 'fastify'
import * as matchHistoryService from './matchHistoryService'

// GET /match-history match history
export async function getMatchHistory(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const matchHistory = await matchHistoryService.getMatchHistory(userId);

  return reply.status(200).send(matchHistory)
}

