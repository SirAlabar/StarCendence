import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to create a new user with OAuth ID
export async function createOauthUser(oauthId: string, email: string, username: string) {
  return await prisma.authUser.create({
    data: {
      oauthId,
      email,
      username,
      oauthEnabled: true,
    },
  });
}

// Function to find user by OAuth ID
export async function findUserByOauthId(oauthId: string) {
  return await prisma.authUser.findFirst({
    where: {
      oauthId,
    },
  });
}