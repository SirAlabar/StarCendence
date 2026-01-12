import * as matchHistoryRepository from './matchHistoryRepository';
import { HttpError } from '../utils/HttpError';


// Get match history for a specific user
export async function getMatchHistory(userId: string) {
  const matchHistory = await matchHistoryRepository.getMatchHistoryByUserId(userId);
  if (!matchHistory) {
    throw new HttpError('Match history not found', 404);
  }
  return matchHistory;
}

