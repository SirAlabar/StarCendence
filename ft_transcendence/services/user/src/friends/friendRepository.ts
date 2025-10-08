import { PrismaClient } from '@prisma/client';
import { FriendRequestStatus } from './friend.types';

const prisma = new PrismaClient();

// Find a friend request by sender and recipient IDs
export async function findFriendRequest(senderId: string, recipientId: string) {
  return prisma.friendship.findFirst({
    where: {
      senderId,
      recipientId,
    },
  });
}

// Find a friendship by user and friend IDs
export async function findFriendship(senderId: string, recipientId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, recipientId },
        { recipientId, senderId },
      ],
      status: FriendRequestStatus.ACCEPTED,
    },
  });
}

// Create a new friend request
export async function createFriendRequest(senderId: string, recipientId: string) {
  return prisma.friendship.create({
    data: {
      senderId,
      recipientId,
      status: FriendRequestStatus.PENDING,
    },
  });
}
