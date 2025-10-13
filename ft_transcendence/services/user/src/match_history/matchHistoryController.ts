import { FastifyReply, FastifyRequest } from 'fastify'
import * as matchHistoryService from './matchHistoryService'
import * as types from './matchHistory.types'

export async function createMatchHistory(req: FastifyRequest, reply: FastifyReply) {
  const { player1Id, player2Id, result, player1Score, player2Score } = req.body as types.matchHistoryBody

  await matchHistoryService.createMatchHistory({ player1Id, player2Id, result, player1Score, player2Score })


  return reply.status(201).send({
    id: 'generated-match-id',
    player1Id,
    player2Id,
    result,
    player1Score,
    player2Score,
    createdAt: new Date()
  })
}
