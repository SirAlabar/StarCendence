import { HttpError } from "../utils/HttpError";
import * as userRepository from "../profile/userRepository";
import * as friendRepository from "./friendRepository";
import { Friend, FriendRequestStatus, mapFriendshipProfilesParams } from './friend.types'

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

  return mapFriendshipProfiles(userId, requests, (f) => f.senderId, 'requests');
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

  const detailedItems: Friend[] = await Promise.all(
    friendships.map(async (f) => {
      const friendId = getFriendId(f);
      const profile = await userRepository.findUserProfileById(friendId);
      return {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      };
    })
  );

  return {
    userId,
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

  const existingRequest = await friendRepository.findFriendRequest(id, recipient.id);
  if (existingRequest) {
    throw new HttpError('Friend request already sent', 400);
  }

  const existingFriendship = await friendRepository.findFriendship(id, recipient.id);
  if (existingFriendship) {
    throw new HttpError('You are already friends with this user', 400);
  }

  await friendRepository.createFriendRequest(id, recipient.id);
  return;
}

// Accept a friend request
export async function acceptFriendRequest(requestId: number, userId: string) {
  const request = await friendRepository.findFriendRequestById(requestId);
  if (!request) {
    throw new HttpError('Friend request not found', 404);
  }

  if (request.recipientId !== userId) {
    throw new HttpError('Unauthorized to accept this friend request', 403);
  }

  if (request.status === 'ACCEPTED') {
    throw new HttpError('Friend request is already accepted', 400);
  }

  await friendRepository.updateFriendRequestStatus(requestId, FriendRequestStatus.ACCEPTED);
  return;
}
