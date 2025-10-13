
export enum MatchResult {
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW'
}

export interface matchHistoryBody {
  player1Id: string
  player2Id: string
  result: MatchResult
  player1Score: number
  player2Score: number
}
