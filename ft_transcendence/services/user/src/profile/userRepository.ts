import { PrismaClient } from '@prisma/client';
import { UserProfile, UserStatus } from './user.types';
import { omit } from 'lodash';

const prisma = new PrismaClient();

// Find all user profiles -- DEBUG PURPOSES
export async function findAllUserProfiles() {
  return prisma.userProfile.findMany();
}

// Create a new user profile
export async function createUserProfile(authId: string, email: string, username: string, oauthEnabled: boolean) {
  return prisma.userProfile.create({
    data: {
      id: authId,
      email,
      username,
      avatarUrl: '/avatars/default.jpeg',
      settings: {
        create: {
          oauthEnabled
        }
      },
      gameStatus: {
        create: {}
      }
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
    where: { id },
  });
}

// Find user profile by username
export async function findUserProfileByUsername(username: string) {
  return prisma.userProfile.findUnique({
    where: { username },
    include: { gameStatus: true }
  });
}

// Update user profile
export async function updateUserProfile(id: string, updatedData: any) {
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

// Search users by username (minimum 2 characters)
export async function searchUsersByUsername(query: string)
{
  return prisma.userProfile.findMany({
    where: {
      username: {
        contains: query
      }
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      status: true
    },
    take: 10
  });
}

// Get user rank by their ID
export async function getUserRank(userId: string)
{
  const user = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: { gameStatus: true }
  });

  if (!user || !user.gameStatus) {
    return null;
  }

  const rank = await prisma.userProfile.count({
    where: {
      gameStatus: {
        points: {
          gt: user.gameStatus.points
        }
      }
    }
  });

  return {
    ...user,
    gameStatus: {
      ...user.gameStatus,
      rank: rank + 1
    }
  };
}

// Update user stats after a game
export async function updateUserStats(userId: string, type: string, mode: string, place: number) {
  const user = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      gameStatus: {
        select: { userStatusId: true }
      }
    }
  });

  if (!user?.gameStatus) return null;

  const isWin = place === 1;
  const isLoss = place !== 1;

  return prisma.userProfile.update({
    where: { id: userId },
    data: {
      gameStatus: {
        update: {
          totalGames: { increment: 1 },
          totalWins: isWin ? { increment: 1 } : undefined,
          totalLosses: isLoss ? { increment: 1 } : undefined,
          totalPongWins: type === 'PONG' && isWin ? { increment: 1 } : undefined,
          totalPongLoss: type === 'PONG' && isLoss ? { increment: 1 } : undefined,
          totalRacerWins: type === 'RACER' && isWin ? { increment: 1 } : undefined,
          totalRacerLoss: type === 'RACER' && isLoss ? { increment: 1 } : undefined,
        },
      },
    },
  });
}



// Update two-factor authentication state
export async function updateTwoFactorState(userId: string, twoFactorEnabled: boolean) {
  const user = await prisma.userProfile.findUnique({
    where: { id: userId },
    include : { settings: true }
  });

  if (!user || !user.settings) {
    return null;
  }

  return prisma.userProfile.update({
    where: { id: userId },
    data: {
      settings: {
        update: {
          twoFactorEnabled
        }
      }
  }});
}

// Get personal user profile by ID 
export async function getPersonalUserProfileById(id: string) {
 const rawUser = await prisma.userProfile.findUnique({
    where: { id },
    include: {
      settings: true,
      gameStatus: true
    }
  });
  
  const safeUser = {
    ...rawUser,
    gameStatus: omit(rawUser?.gameStatus, ['userStatusId']),
    settings: omit(rawUser?.settings, ['userSettingsId'])
  }
  return safeUser;
}

// Update user settings
export async function updateUserSettings(id: string, settings: any) {
  return prisma.userProfile.update({
    where: { id },
    data: {
      settings: {
        update: settings
      }
    },
    include: {
      settings: true
    }
  });
}

// Delete user profile
export async function deleteUserProfile(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.friendship.deleteMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
    });

    await tx.userGameStatus.deleteMany({
      where: { userStatusId: userId },
    });

    await tx.userSettings.deleteMany({
      where: { userSettingsId: userId },
    });

    await tx.userProfile.delete({
      where: { id: userId },
    });
  });
}