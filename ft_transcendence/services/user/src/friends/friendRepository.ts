import { PrismaClient } from '@prisma/client';
import { FriendRequestStatus } from './friend.types';

const prisma = new PrismaClient();

// Get friends for a user
export async function findFriendsByUserId(userId: string) {
  return prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId },
        { recipientId: userId },
      ],
      status: FriendRequestStatus.ACCEPTED,
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
      status: FriendRequestStatus.PENDING,
    },
  });
}

// Get sent friend requests for a user
export async function findSentFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      senderId: userId,
      status: FriendRequestStatus.PENDING,
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

// Update the friend request status
export async function updateFriendRequestStatus(requestId: number, newStatus: FriendRequestStatus) : Promise<void> {
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
