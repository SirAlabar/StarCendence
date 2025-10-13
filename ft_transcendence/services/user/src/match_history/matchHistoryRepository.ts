import { PrismaClient } from '@prisma/client';
import { MatchResult, matchHistoryBody } from './matchHistory.types';

const prisma = new PrismaClient();

export async function createMatchHistoryEntry(data: matchHistoryBody) {
  return prisma.matchHistory.create({
    data: {
      player1Id: data.player1Id,
      player2Id: data.player2Id,
      result: data.result,
      player1Score: data.player1Score,
      player2Score: data.player2Score,
      playedAt: new Date()
    },
  });
}

export async function getMatchHistoryByUserId(userId: string) {
  return prisma.matchHistory.findMany({
    where: {
      OR: [
        { player1Id: userId },
        { player2Id: userId }
      ]
    },
    orderBy: {
      playedAt: 'desc'
    }
  });
}

export async function countMatchHistoryByUserId(userId: string) {
  return prisma.matchHistory.count({
    where: {
      OR: [
        { player1Id: userId },
        { player2Id: userId }
      ]
    }
  });
}

export async function getMatchHistoryById(matchId: number) {
  return prisma.matchHistory.findUnique({
    where: { id: matchId }
  });
}