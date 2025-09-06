import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update user's 2FA secret
export async function updateTwoFactorSecret(userId: string, secret: string) {
  return prisma.authUser.update({
    where: { id: userId },
    data: { twoFactorSecret: secret }
  });
}

// Check if 2FA is enabled for user
export async function isTwoFactorEnabled(userId: string) {
  const user = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true }
  });
  return user?.twoFactorEnabled || false;
}

// Get user's 2FA secret
export async function getTwoFactorSecret(userId: string) {
  const user = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true }
  });
  return user?.twoFactorSecret || null;
}

// Enable 2FA
export async function enableTwoFactor(userId: string) {
  return prisma.authUser.update({
    where: { id: userId },
    data: { twoFactorEnabled: true }
  });
}

// Disable 2FA
export async function disableTwoFactor(userId: string) {
  return prisma.authUser.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null }
  });
}





