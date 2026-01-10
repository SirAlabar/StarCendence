import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMatchHistoryByUserId(userId: string) {
  return await prisma.match.findMany({
    where: {
      results: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      type: true,
      mode: true,
      winnerId: true,
      duration: true,
      totalPoints: true,
      fastestLap: true,
      playedAt: true,
      results: {
        select: {
          userId: true,
          score: true,
          accuracy: true,
          topSpeed: true,
        },
        orderBy: { score: 'desc' },
      },
    },
    orderBy: { playedAt: 'desc' },
    take: 50,
  });
}

