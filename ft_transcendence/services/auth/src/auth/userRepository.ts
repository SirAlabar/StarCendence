import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new user
export async function createUser(email: string, hashedPassword: string, username: string) {
  return prisma.authUser.create({
    data: {
      email,
      password: hashedPassword,
      username
    }
  });
}

// Find user by email
export async function findUserByEmail(email: string) {
  return prisma.authUser.findUnique({
    where: { email }
  });
}

// Find user by email or username
export async function findUserByEmailOrUsername(email: string, username: string) {
  return prisma.authUser.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });
}

// Find user by username
export async function findUserByUsername(username: string) {
  return prisma.authUser.findUnique({
    where: { username }
  });
}

// Find user by ID
export async function findUserById(id: string) {
  return prisma.authUser.findUnique({
    where: { id }
  });
}

