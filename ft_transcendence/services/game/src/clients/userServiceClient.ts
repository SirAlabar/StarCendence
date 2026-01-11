import { GameType } from '@/utils/constants';
import { HttpError } from '../utils/HttpError';
import { getInternalApiKey } from '../utils/secretsUtils';
import { GamePlayer } from '@/types/player.types';

// Create user in User Service
export async function updateUserStats(type: GameType, mode: GameType, players: GamePlayer[], winnerUserId: string | null) {
  const response = await fetch('http://user-service:3004/internal/update-user-stats', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    },
    body: JSON.stringify({
      type,
      mode,
      players: players.map((player) => ({
        userId: player.userId,
        score: player.score || 0,
      })),
      winnerUserId
    })
  });

  if (!response.ok) {
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  return await response.json();
}
