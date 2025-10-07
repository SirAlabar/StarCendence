import { HttpError } from "../utils/HttpError";
import * as userRepository from "../repositories/userRepository";
import * as friendRepository from "../repositories/friendRepository";

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

