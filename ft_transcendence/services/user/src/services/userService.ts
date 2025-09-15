import { HttpError } from "../utils/HttpError";
import * as userRepository from "../repositories/userRepository";

// Create a new user profile
export async function createUserProfile(authId: string, email: string, username: string) {
  if (!authId || !email || !username) {
    throw new HttpError('Auth ID, email, and username are required', 400);
  }

  await userRepository.createUserProfile(authId, email, username);
}

// Find user profile by ID
export async function findUserProfileById(id: string) {
  const user = await userRepository.findUserProfileById(id);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  return user;
}