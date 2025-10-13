import * as types from './matchHistory.types';
import * as userRepository from '../profile/userRepository';
import * as matchHistoryRepository from './matchHistoryRepository';


export async function createMatchHistory(data: types.matchHistoryBody) {
  const player1 = await userRepository.findUserProfileById(data.player1Id);
  const player2 = await userRepository.findUserProfileById(data.player2Id);

  if (!player1 || !player2) {
    throw new Error('User not found');
  }

  const matchHistoryEntry = {
    player1: player1.id,
    player2: player2.id,
    result: data.result,
    player1Score: data.player1Score,
    player2Score: data.player2Score
  };

  await matchHistoryRepository.createMatchHistoryEntry(matchHistoryEntry);
}

}

