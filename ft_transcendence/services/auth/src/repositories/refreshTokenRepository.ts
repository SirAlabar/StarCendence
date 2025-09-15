import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create and store a new refresh token
export async function create(userId: string, token: string, expiresAt: Date) {
  return await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
}

// Find refresh token by its token string
export async function findByToken(token: string) {
  return await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });
}

// Find refresh token by user ID
export async function findByUserId(userId: string) {
  return await prisma.refreshToken.findFirst({
    where: { userId },
    include: { user: true }
  });
}

// Delete refresh token by its token string
export async function deleteByToken(token: string) {
  return await prisma.refreshToken.delete({
    where: { token }
  });
}

// Delete all refresh tokens for a user
export async function deleteAllByUserId(userId: string) {
  return await prisma.refreshToken.deleteMany({
    where: { userId }
  });
}

// Get all active (non-expired) refresh tokens for a user
export async function findActiveByUserId(userId: string) {
  return await prisma.refreshToken.findMany({
    where: { 
      userId,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      token: false
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Delete refresh token by its ID
export async function deleteById(id: string) {
  return await prisma.refreshToken.delete({
    where: { id }
  });
}
