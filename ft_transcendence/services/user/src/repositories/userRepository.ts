import { PrismaClient } from '@prisma/client';

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