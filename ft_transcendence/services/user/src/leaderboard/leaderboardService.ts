import * as leaderboardRepository from './leaderboardRepository';
import { HttpError } from '../utils/HttpError';

// Get leaderboard
export async function getLeaderboard()
{
  const users = await leaderboardRepository.getLeaderboard();
  if (!users) {
    throw new HttpError("Users not found", 404);
  }

  return users.map((user: any, index: number) => ({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    status: user.status,
    wins: user.gameStatus.totalWins,
    losses: user.gameStatus.totalLosses,
    points: user.gameStatus.points,
    rank: index + 1
  }));
}
