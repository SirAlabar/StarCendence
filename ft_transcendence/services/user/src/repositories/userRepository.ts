import { PrismaClient } from '@prisma/client';
import { UserProfile } from '../types/user.types';

const prisma = new PrismaClient();

// Create a new user profile
export async function createUserProfile(authId: string, email: string, username: string) {
  return prisma.userProfile.create({
    data: {
      id: authId,
      email,
      username
    }
  });
}

// Find user profile by ID
export async function findUserProfileById(id: string) {
  return prisma.userProfile.findUnique({
    where: { id }
  });
}

// Update user profile
export async function updateUserProfile(id: string, updatedData: Partial<UserProfile>) {
  return prisma.userProfile.update({
    where: { id },
    data: updatedData
  });
}

// Upload or update user profile image
export async function uploadProfileImage(id:string, filename: string) {
  return prisma.userProfile.update({
    where: { id },
    data: {
      avatarUrl: `/avatars/${filename}`
    }
  });
}
