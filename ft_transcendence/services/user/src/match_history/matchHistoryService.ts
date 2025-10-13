import * as types from './matchHistory.types';
import * as userRepository from '../profile/userRepository';
import * as matchHistoryRepository from './matchHistoryRepository';
import { HttpError } from '../utils/HttpError';

// Create a new match history entry, internal route
export async function createMatchHistory(data: types.matchHistoryBody) {
  const player1 = await userRepository.findUserProfileById(data.player1Id);
  const player2 = await userRepository.findUserProfileById(data.player2Id);
  if (!player1 || !player2) {
    throw new HttpError('One or both players not found', 404);
  }

  const matchHistoryEntry = {
    player1Id: player1.id,
    player2Id: player2.id,
    result: data.result,
    player1Score: data.player1Score,
    player2Score: data.player2Score
  };

  const result: types.matchHistoryEntry = await matchHistoryRepository.createMatchHistoryEntry(matchHistoryEntry);
  if (!result) {
    throw new HttpError('Failed to create match history entry', 500);
  }

  return result;
}

// Get match history for a specific user
export async function getMatchHistory(userId: string) {
  const entries = await matchHistoryRepository.getMatchHistoryByUserId(userId);
  if (!entries) {
    throw new HttpError('Failed to retrieve match history', 500);
  }

  return entries;
}


// Get a specific match history entry by ID
export async function getMatchHistoryById(matchId: number) {
  const matchHistory = await matchHistoryRepository.getMatchHistoryById(matchId);
  if (!matchHistory) {
    throw new HttpError('Match history not found', 404);
  }

  return matchHistory;
}


