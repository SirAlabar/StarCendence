import { PrismaClient } from '@prisma/client';
import { UserProfile, UserStatus } from './user.types';

const prisma = new PrismaClient();

// Find all user profiles -- DEBUG PURPOSES
export async function findAllUserProfiles() {
  return prisma.userProfile.findMany();
}

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

// Update user status
export async function updateUserStatus(id: string, status: UserStatus) {
  return prisma.userProfile.update({
    where: { id },
    data: { status }
  });
}

// Find user profile by ID
export async function findUserProfileById(id: string) {
  return prisma.userProfile.findUnique({
    where: { id }
  });
}

// Find user profile by username
export async function findUserProfileByUsername(username: string) {
  return prisma.userProfile.findUnique({
    where: { username }
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
