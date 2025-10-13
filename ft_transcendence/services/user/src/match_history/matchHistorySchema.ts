import { MatchResult } from "./matchHistory.types";

// internal match history schema
export const createMatchHistorySchema = {
  body: {
    type: 'object',
    required: ['player1Id', 'player2Id', 'result', 'player1Score', 'player2Score'],
    properties: {
      player1Id: { type: 'string', format: 'uuid' },
      player2Id: { type: 'string', format: 'uuid' },
      result: { type: 'string', enum: Object.values(MatchResult) },
      player1Score: { type: 'number' },
      player2Score: { type: 'number' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        player1Id: { type: 'string', format: 'uuid' },
        player2Id: { type: 'string', format: 'uuid' },
        result: { type: 'string', enum: Object.values(MatchResult) },
        player1Score: { type: 'number' },
        player2Score: { type: 'number' },
        playedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};