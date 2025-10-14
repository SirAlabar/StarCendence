
export enum MatchResult {
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW'
}

export interface matchHistoryBody {
  player1Id: string
  player2Id: string
  result: string
  player1Score: number
  player2Score: number
}

export interface matchHistoryEntry {
  id: number
  player1Id: string
  player2Id: string
  result: string
  player1Score: number
  player2Score: number
  playedAt: Date
}

