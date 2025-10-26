// Score calculation utilities
import { GamePlayer } from '@prisma/client';

/**
 * Determine winner from players
 */
export function determineWinner(players: GamePlayer[]): string | undefined
{
  if (players.length === 0)
  {
    return undefined;
  }

  // Find player with highest score
  let winner = players[0];
  for (const player of players)
  {
    if (player.score > winner.score)
    {
      winner = player;
    }
  }

  return winner.userId;
}

/**
 * Calculate ranking of players based on scores
 */
export function calculateRanking(players: GamePlayer[]): Map<string, number>
{
  const ranking = new Map<string, number>();

  // Sort players by score (descending)
  const sorted = [...players].sort((a, b) => b.score - a.score);

  // Assign positions
  sorted.forEach((player, index) => {
    ranking.set(player.userId, index + 1);
  });

  return ranking;
}

/**
 * Check if game should end based on max score
 */
export function shouldGameEnd(scores: number[], maxScore: number): boolean
{
  return scores.some(score => score >= maxScore);
}

/**
 * Format final scores for display
 */
export function formatFinalScores(players: GamePlayer[]): Array<{ userId: string; score: number; position: number }>
{
  const ranking = calculateRanking(players);
  
  return players.map(player => ({
    userId: player.userId,
    score: player.score,
    position: ranking.get(player.userId) || 999,
  }));
}