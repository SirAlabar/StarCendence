import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get leaderboard - top players by points
export async function getLeaderboard()
{
  return prisma.userProfile.findMany(
  {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      status: true,
      totalWins: true,
      totalLosses: true,
      points: true
    },
    orderBy: {
      points: 'desc'
    },
    take: 10
  });
}