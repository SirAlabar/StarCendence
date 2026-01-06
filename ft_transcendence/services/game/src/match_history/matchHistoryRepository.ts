import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMatchHistory(userId: string) {
  return prisma.game.findMany({
    where: {
      players: {
        some: {
          userId: userId,
        }
      }
    },
    include: {
      players : {
        where: { userId: userId },
      }
    }
  });
}
