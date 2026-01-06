import { FastifyReply, FastifyRequest } from 'fastify'
import * as matchHistoryService from './matchHistoryService'
import * as types from './matchHistory.types'

// GET /match-history match history
export async function getMatchHistory(req: FastifyRequest, reply: FastifyReply) {
   const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const matchHistory = await matchHistoryService.getMatchHistory(userId)

  return reply.status(200).send(matchHistory)
}

// GET /match-history/:id match history by id
export async function getMatchHistoryById(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const matchId = req.params.id as string;

  const matchHistory = await matchHistoryService.getMatchHistoryById(matchId);
  if (!matchHistory) {
    return reply.status(404).send({ error: 'Match history not found' });
  }

  // if (matchHistory.player1Id !== userId && matchHistory.player2Id !== userId) {
  //   return reply.status(403).send({ error: 'Forbidden: you do not have access to this match history' });
  // }

  return reply.status(200).send(matchHistory)
}

