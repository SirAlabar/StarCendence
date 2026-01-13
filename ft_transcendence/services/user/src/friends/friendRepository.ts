import { PrismaClient } from '@prisma/client';
import { FriendshipStatus } from './friend.types';

const prisma = new PrismaClient();

// Get friends for a user
export async function findFriendsByUserId(userId: string) {
  return prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId },
        { recipientId: userId },
      ],
      status: FriendshipStatus.ACCEPTED,
    },
  });
}

// Find a friend request by its ID
export async function findFriendRequestById(requestId: number) {
  return prisma.friendship.findUnique({
    where: { id: requestId },
  });
}

// Get incoming friend requests for a user
export async function findIncomingFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      recipientId: userId,
      status: FriendshipStatus.PENDING,
    },
  });
}

// Get sent friend requests for a user
export async function findSentFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      senderId: userId,
      status: FriendshipStatus.PENDING,
    },
  });
}

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
export async function findFriendship(user1: string, user2: string) {
   return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: user1, recipientId: user2 },
        { recipientId: user1, senderId: user2 },
      ],
      status: FriendshipStatus.ACCEPTED,
    },
  });
}

// Create a new friend request
export async function createFriendRequest(senderId: string, recipientId: string) {
  return prisma.friendship.create({
    data: {
      senderId,
      recipientId,
      status: FriendshipStatus.PENDING,
    },
  });
}

// Update the friend request status
export async function updateFriendshipStatus(requestId: number, newStatus: FriendshipStatus) {
  return prisma.friendship.update({
    where: { id: requestId },
    data: {
      status: newStatus,
    },
  });
}

// Delete a friend request (or friendship)
export async function deleteFriendship(requestId: number) {
  return prisma.friendship.delete({
    where: { id: requestId },
  });
}