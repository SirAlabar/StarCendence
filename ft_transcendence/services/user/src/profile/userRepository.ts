import { PrismaClient } from '@prisma/client';
import { UserProfile, UserStatus } from './user.types';

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

// Search users by username (minimum 2 characters)
export async function searchUsersByUsername(query: string)
{
  return prisma.userProfile.findMany(
  {
    where: 
    {
      username: 
      {
        contains: query
      }
    },
    select: 
    {
      id: true,
      username: true,
      avatarUrl: true,
      status: true
    },
    take: 10
  });
}

// Get leaderboard - top players by points
export async function getLeaderboard(limit: number = 10)
{
  return prisma.userProfile.findMany(
  {
    select: 
    {
      id: true,
      username: true,
      avatarUrl: true,
      status: true,
      totalWins: true,
      totalLosses: true,
      points: true
    },
    orderBy: 
    {
      points: 'desc'
    },
    take: limit
  });
}

// Get user rank by their ID
export async function getUserRank(userId: string)
{
  const user = await prisma.userProfile.findUnique(
  {
    where: { id: userId },
    select: 
    {
      id: true,
      username: true,
      avatarUrl: true,
      status: true,
      totalWins: true,
      totalLosses: true,
      points: true
    }
  });

  if (!user) 
  {
    return null;
  }

  // Count how many users have more points
  const rank = await prisma.userProfile.count(
  {
    where: 
    {
      points: 
      {
        gt: user.points || 0
      }
    }
  });

  return {
    ...user,
    rank: rank + 1
  };
}

// Update user stats after a game (for Game Service to call)
export async function updateUserStats(userId: string, won: boolean, pointsEarned: number)
{
  const user = await prisma.userProfile.findUnique(
  {
    where: { id: userId }
  });

  if (!user) 
  {
    return null;
  }

  return prisma.userProfile.update(
  {
    where: { id: userId },
    data: 
    {
      totalWins: won ? (user.totalWins || 0) + 1 : user.totalWins,
      totalLosses: !won ? (user.totalLosses || 0) + 1 : user.totalLosses,
      points: (user.points || 0) + pointsEarned
    }
  });
}


// Update two-factor authentication state
export async function updateTwoFactorState(userId: string, twoFactorEnabled: boolean) {
  const user = await prisma.userProfile.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return null;
  }

  return prisma.userProfile.update({
    where: { id: userId },
    data: {
      twoFactorEnabled
    }
  });
}