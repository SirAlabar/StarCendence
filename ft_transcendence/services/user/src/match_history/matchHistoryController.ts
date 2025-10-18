import { FastifyReply, FastifyRequest } from 'fastify'
import * as matchHistoryService from './matchHistoryService'
import * as types from './matchHistory.types'

// POST /internal/match-history/create create a new match history entry (internal use)
export async function createMatchHistory(req: FastifyRequest, reply: FastifyReply) {
  const { player1Id, player2Id, result, player1Score, player2Score } = req.body as types.matchHistoryBody
  if (player1Id === player2Id) {
    return reply.status(400).send({ error: 'A player cannot play against themselves' })
  }

  const matchHistoryEntry: types.matchHistoryEntry = await matchHistoryService.createMatchHistory({
    player1Id, player2Id, result, player1Score, player2Score
  })

  return reply.status(201).send(matchHistoryEntry)
}

// GET /match-history match history for authenticated user
export async function getMatchHistory(req: FastifyRequest, reply: FastifyReply) {
   const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const matchHistory: types.matchHistoryBody[] = await matchHistoryService.getMatchHistory(userId)

  return reply.status(200).send(matchHistory)
}

// GET /match-history/:id match history by id for authenticated user
export async function getMatchHistoryById(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const matchId = parseInt((req.params as { id: string }).id, 10);
  if (isNaN(matchId)) {
    return reply.status(400).send({ error: 'Invalid match history id' });
  }

  const matchHistory = await matchHistoryService.getMatchHistoryById(matchId);
  if (!matchHistory) {
    return reply.status(404).send({ error: 'Match history not found' });
  }

  if (matchHistory.player1Id !== userId && matchHistory.player2Id !== userId) {
    return reply.status(403).send({ error: 'Forbidden: you do not have access to this match history' });
  }

  return reply.status(200).send(matchHistory)
}

