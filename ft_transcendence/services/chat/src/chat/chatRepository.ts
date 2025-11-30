import { PrismaClient } from '@prisma/client';
import { getRoomId } from './chatService';

const prisma = new PrismaClient();

export async function getConversationByRoomId(roomId: string) {
  return prisma.chatConversation.findFirst({
    where: { roomId },
    include: {
      messages: true,
    },
  });
}

export async function createConversation(userId: string, targetUserId: string) {
  const roomId = await getRoomId(userId, targetUserId);
  return prisma.chatConversation.create({
    data: {
      roomId,
      userAId: userId,
      userBId: targetUserId,
    },
  });
}