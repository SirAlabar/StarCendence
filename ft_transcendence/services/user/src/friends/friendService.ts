import { HttpError } from "../utils/HttpError";
import * as userRepository from "../profile/userRepository";
import * as friendRepository from "./friendRepository";
import { Friend, FriendshipStatus } from './friend.types'

// Get friends list for a user
export async function getFriends(userId: string) {
  const friendships = await friendRepository.findFriendsByUserId(userId);
  if (!friendships) {
    throw new HttpError('No friends found', 404);
  }

  return mapFriendshipProfiles(userId, friendships, (f) => (f.senderId === userId ? f.recipientId : f.senderId), 'friends');
}

// Get incoming friend requests for a user
export async function getFriendRequests(userId: string) {
  const requests = await friendRepository.findIncomingFriendRequests(userId);
  if (!requests) {
    throw new HttpError('No friend requests found', 404);
  }

  return mapFriendshipProfiles(userId, requests, (f) => f.senderId, 'receivedRequests');
}

// Get sent friend requests for a user
export async function getSentFriendRequests(userId: string) {
  const requests = await friendRepository.findSentFriendRequests(userId);
  if (!requests) {
    throw new HttpError('No sent friend requests found', 404);
  }

  return mapFriendshipProfiles(userId, requests, (f) => f.recipientId, 'sentRequests');
}

// Helper to map friendships or requests to detailed profiles
async function mapFriendshipProfiles(userId: string, friendships: any[], getFriendId: (f: any) => string, collectionKey: string): Promise<any> {
  if (!friendships || friendships.length === 0) {
    throw new HttpError('No items found', 404);
  }
  const userProfile = await userRepository.findUserProfileById(userId);
  if (!userProfile) {
    throw new HttpError('User not found', 404);
  }

  const detailedItems: Friend[] = await Promise.all(
    friendships.map(async (f) => {
      const friendId = getFriendId(f);
      const profile = await userRepository.findUserProfileById(friendId);
      if (!profile) {
        throw new HttpError('Friend profile not found', 404);
      }
      return {
        requestId: f.id,
        userId: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      };
    })
  );

  return {
    userId,
    username: userProfile.username,
    avatarUrl: userProfile.avatarUrl,
    [collectionKey]: detailedItems,
  };
}

// Send a friend request to a user by their username
export async function sendFriendRequest(id: string, username: string) {
  const recipient =  await userRepository.findUserProfileByUsername(username);
  if (!recipient) {
    throw new HttpError('Recipient not found', 404);
  }
  if (recipient.id === id) {
    throw new HttpError('Cannot send friend request to yourself', 400);
  }

  const exitisingRequestFromRecipient = await friendRepository.findFriendRequest(recipient.id, id);
  if (exitisingRequestFromRecipient && exitisingRequestFromRecipient.status === FriendshipStatus.PENDING) {
    await friendRepository.updateFriendshipStatus(exitisingRequestFromRecipient.id, FriendshipStatus.ACCEPTED);
    return 'ACCEPTED';
  }

  const existingRequest = await friendRepository.findFriendRequest(id, recipient.id);
  if (existingRequest) {
    throw new HttpError('Friend request already sent', 400);
  }

  const existingFriendship = await friendRepository.findFriendship(id, recipient.id);
  if (existingFriendship) {
    throw new HttpError('You are already friends with this user', 400);
  }

  await friendRepository.createFriendRequest(id, recipient.id);
  return 'SENT';
}

// Accept a friend request
export async function acceptFriendRequest(requestId: number, userId: string) {
  const request = await friendRepository.findFriendRequestById(requestId);
  if (!request) {
    throw new HttpError('Friend request not found', 404);
  }
  
  if (request.status === FriendshipStatus.ACCEPTED) {
    throw new HttpError('Friend request is already accepted', 400);
  }

  if (request.status !== FriendshipStatus.PENDING) {
    throw new HttpError('Friend request is not pending', 400);
  }

  if (request.recipientId !== userId) {
    throw new HttpError('Unauthorized to accept this friend request', 403);
  }

  await friendRepository.updateFriendshipStatus(requestId, FriendshipStatus.ACCEPTED);
  return;
}

// Reject a friend request
export async function rejectFriendRequest(requestId: number, userId: string) {
  const request = await friendRepository.findFriendRequestById(requestId);
  if (!request) {
    throw new HttpError('Friend request not found', 404);
  }

  if (request.status !== FriendshipStatus.PENDING) {
    throw new HttpError('Friend request is not pending', 400);
  }

  if (request.recipientId !== userId) {
    throw new HttpError('Unauthorized to reject this friend request', 403);
  }

  await friendRepository.updateFriendshipStatus(requestId, FriendshipStatus.REJECTED);
  return;
}

// Cancel a sent friend request
export async function cancelFriendRequest(requestId: number, userId: string) {
  const request = await friendRepository.findFriendRequestById(requestId);
  if (!request) {
    throw new HttpError('Friend request not found', 404);
  }

  if (request.status !== FriendshipStatus.PENDING) {
    throw new HttpError('Friend request is not pending', 400);
  }

  if (request.senderId !== userId) {
    throw new HttpError('Unauthorized to cancel this friend request', 403);
  }

  await friendRepository.deleteFriendship(requestId);
  return;
}

// Unfriend a user
export async function unfriend(friendId: string, userId: string) {
  const friendship = await friendRepository.findFriendship(userId, friendId);
  if (!friendship) {
    throw new HttpError('Friendship not found', 404);
  }

  await friendRepository.deleteFriendship(friendship.id);
  return;
}