import { PrismaClient } from '@prisma/client';
import { GameSession } from '../types/game.types';
import { updateUserStats } from '../clients/userServiceClient';

const prisma = new PrismaClient();

export async function saveMatchToDb(session: GameSession) {
  const { id: gameId, type, mode } = session.game;
  console.log('session:', session);
  const scores = session.state.scores;
  const players = Array.from(session.players.values());
  const duration = Math.floor(session.state.timeElapsed / 1000);
  
  const maxScore = Math.max(...scores);
  const winnerIndex = scores.findIndex(s => s === maxScore);
  const winnerUserId = winnerIndex >= 0 ? players[winnerIndex]?.userId : null;

  await updateUserStats(type, mode, players, winnerUserId);

  return await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        gameId,
        type,
        mode,
        winnerId: winnerUserId || undefined,
        duration,
        results: {
          createMany: {
            data: players.map((player) => ({
              userId: player.userId,
              username: player.username,
              score: player.score || 0,
            })),
          },
        },
      },
      include: {
        results: true,
      },
    });

    await tx.game.update({
      where: { id: gameId },
      data: { endedAt: new Date() },
    });

    return match;
  });
}
