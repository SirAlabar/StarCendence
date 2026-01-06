import * as matchHistoryRepository from './matchHistoryRepository';
import { HttpError } from '../utils/HttpError';


// Get match history for a specific user
export async function getMatchHistory(userId: string) {
  return "Match history data for user " + userId;
}


// Get a specific match history entry by ID
export async function getMatchHistoryById(matchId: string) {
  return "Match history data for match ID " + matchId;
}


