import { HttpError } from "../utils/HttpError";
import * as userRepository from "./userRepository";
import { UserProfile, UserStatus } from "./user.types";
import path from "path";
import fs from 'fs/promises';

// Create a new user profile (internal)
export async function createUserProfile(authId: string, email: string, username: string) {
  if (!authId || !email || !username) {
    throw new HttpError('Auth ID, email, and username are required', 400);
  }

  await userRepository.createUserProfile(authId, email, username);
}

// Update user status (internal)
export async function updateUserStatus(id: string, status: UserStatus) : Promise<UserProfile> {
  const user = await userRepository.updateUserStatus(id, status);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  return user;
}

// Find user profile by ID
export async function findUserProfileById(id: string) {
  const user = await userRepository.findUserProfileById(id);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  return user;
}

// Find user profile by username
export async function findUserProfileByUsername(username: string) {
  const user = await userRepository.findUserProfileByUsername(username);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  return user;
}

// Update user profile
export async function updateUserProfile(id: string, updatedData: Partial<UserProfile>) {
  const user = await userRepository.updateUserProfile(id, updatedData);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  return user;
}

// Upload or update user profile image
export async function uploadProfileImage(id: string, image: any): Promise<string> 
{
  if (!image) 
  {
    throw new HttpError('No image provided', 400);
  }

  const ext = path.extname(image.filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) 
  {
    throw new HttpError('Invalid image format. Only JPG, PNG, GIF, and WEBP are allowed.', 400);
  }
   
  const uniqueName = `${id}-${Date.now()}${ext}`;
  const uploadPath = path.join(__dirname, '../../uploads/avatars', uniqueName);
  
  await fs.mkdir(path.dirname(uploadPath), { recursive: true });

  const buffer = await image.toBuffer();
  
  await fs.writeFile(uploadPath, buffer);

  const avatarUrl = `/avatars/${uniqueName}`;
  const user = await userRepository.uploadProfileImage(id, uniqueName);
  
  if (!user) 
  {
    try 
    {
      await fs.unlink(uploadPath);
    } 
    catch (unlinkError) 
    {
      console.error('Failed to cleanup file:', unlinkError);
    }
    throw new HttpError('User not found', 404);
  }

  return user.avatarUrl ?? '';
}

// Search users by username
export async function searchUsers(query: string)
{
  if (!query || query.trim().length < 2)
  {
    throw new HttpError('Search query must be at least 2 characters', 400);
  }

  const users = await userRepository.searchUsersByUsername(query.trim());
  return users;
}

