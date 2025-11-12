// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function copyImageToAvatars(filename: string, userId: string): string 
{
  const AVATARS_DIR = '/app/data/avatars';
  const SOURCE_IMAGES_DIR = '/app/seed-images/users';
  
  const sourcePath = path.join(SOURCE_IMAGES_DIR, filename);
  const destFilename = `seed-${userId}-${filename}`;
  const destPath = path.join(AVATARS_DIR, destFilename);
  
  if (!fs.existsSync(AVATARS_DIR)) 
  {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }
  
  if (fs.existsSync(sourcePath)) 
  {
    try 
    {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied avatar: ${filename} -> ${destFilename}`);
      return `/avatars/${destFilename}`;
    } 
    catch (error) 
    {
      console.error(`❌ Failed to copy ${filename}:`, error);
      return '';
    }
  } 
  else 
  {
    console.warn(`⚠️  Source not found: ${sourcePath}`);
    return '';
  }
}

async function main() 
{
  const existingUsers = await prisma.userProfile.count();
  
  if (existingUsers > 0) 
  {
    console.log('⚠️  Database already has users. Skipping seed.');
    console.log(`Found ${existingUsers} existing users.`);
    return;
  }

  console.log('🌱 Starting database seed...');

  const users = [
    { 
      id: '550e8400-e29b-41d4-a716-446655440001', 
      username: 'Anakin_Skywalker', 
      email: 'anakin@force.com', 
      bio: 'The Chosen One. Podracer champion turned Jedi.', 
      status: 'OFFLINE', 
      avatar: 'anakin.gif',
      // Overall stats
      totalGames: 177,
      totalWins: 145,
      totalLosses: 32,
      totalDraws: 0,
      totalWinPercent: 81.9,
      points: 2450,
      // Game modes
      totalPongWins: 78,
      totalPongLoss: 15,
      totalRacerWins: 67,
      totalRacerLoss: 17,
      // Tournaments
      tournamentWins: 5,
      tournamentParticipations: 12
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440002', 
      username: 'Padme_Amidala', 
      email: 'padme@nabooprincess.com', 
      bio: 'Former Queen of Naboo. Fearless senator.', 
      status: 'OFFLINE', 
      avatar: 'padme.gif',
      totalGames: 177,
      totalWins: 132,
      totalLosses: 45,
      totalDraws: 0,
      totalWinPercent: 74.6,
      points: 2180,
      totalPongWins: 71,
      totalPongLoss: 22,
      totalRacerWins: 61,
      totalRacerLoss: 23,
      tournamentWins: 3,
      tournamentParticipations: 10
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440003', 
      username: 'Darth_Vader', 
      email: 'vader@empire.gov', 
      bio: 'Lord of the Sith. Wears black. Breathing enthusiast.', 
      status: 'OFFLINE', 
      avatar: 'vader.gif',
      totalGames: 169,
      totalWins: 118,
      totalLosses: 51,
      totalDraws: 0,
      totalWinPercent: 69.8,
      points: 1920,
      totalPongWins: 65,
      totalPongLoss: 28,
      totalRacerWins: 53,
      totalRacerLoss: 23,
      tournamentWins: 4,
      tournamentParticipations: 9
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440004', 
      username: 'Sebulba', 
      email: 'sebulba@malastare.pod', 
      bio: 'Dug podracer pilot. Hates Skywalker.', 
      status: 'OFFLINE', 
      avatar: 'sebulba.gif',
      totalGames: 165,
      totalWins: 105,
      totalLosses: 60,
      totalDraws: 0,
      totalWinPercent: 63.6,
      points: 1800,
      totalPongWins: 52,
      totalPongLoss: 31,
      totalRacerWins: 53,
      totalRacerLoss: 29,
      tournamentWins: 2,
      tournamentParticipations: 8
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440005', 
      username: 'Gasgano', 
      email: 'gasgano@troiken.pod', 
      bio: 'Xexto podracer with 24 fingers. Speed is everything.', 
      status: 'OFFLINE', 
      avatar: 'gasgano.jpg',
      totalGames: 163,
      totalWins: 98,
      totalLosses: 65,
      totalDraws: 0,
      totalWinPercent: 60.1,
      points: 1700,
      totalPongWins: 48,
      totalPongLoss: 33,
      totalRacerWins: 50,
      totalRacerLoss: 32,
      tournamentWins: 2,
      tournamentParticipations: 7
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440006', 
      username: 'Teemto_Pagalies', 
      email: 'teemto@moonus.pod', 
      bio: 'Veknoid podracer. Cool under pressure.', 
      status: 'OFFLINE', 
      avatar: 'teemto.jpg',
      totalGames: 160,
      totalWins: 92,
      totalLosses: 68,
      totalDraws: 0,
      totalWinPercent: 57.5,
      points: 1600,
      totalPongWins: 45,
      totalPongLoss: 35,
      totalRacerWins: 47,
      totalRacerLoss: 33,
      tournamentWins: 1,
      tournamentParticipations: 6
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440007', 
      username: 'Ratts_Tyerell', 
      email: 'ratts@aleen.pod', 
      bio: 'Tiny but fierce Aleena podracer.', 
      status: 'OFFLINE', 
      avatar: 'ratts.jpg',
      totalGames: 160,
      totalWins: 87,
      totalLosses: 73,
      totalDraws: 0,
      totalWinPercent: 54.4,
      points: 1500,
      totalPongWins: 42,
      totalPongLoss: 38,
      totalRacerWins: 45,
      totalRacerLoss: 35,
      tournamentWins: 1,
      tournamentParticipations: 5
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440008', 
      username: 'Ebe_Endocott', 
      email: 'ebe@ryvellia.pod', 
      bio: 'Rybet podracer from Ando Prime.', 
      status: 'OFFLINE', 
      avatar: 'ebe.jpg',
      totalGames: 159,
      totalWins: 81,
      totalLosses: 78,
      totalDraws: 0,
      totalWinPercent: 50.9,
      points: 1400,
      totalPongWins: 40,
      totalPongLoss: 40,
      totalRacerWins: 41,
      totalRacerLoss: 38,
      tournamentWins: 0,
      tournamentParticipations: 5
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440009', 
      username: 'Mars_Guo', 
      email: 'mars@phuii.pod', 
      bio: 'Phuii podracer with a need for speed.', 
      status: 'OFFLINE', 
      avatar: 'mars.gif',
      totalGames: 158,
      totalWins: 76,
      totalLosses: 82,
      totalDraws: 0,
      totalWinPercent: 48.1,
      points: 1300,
      totalPongWins: 37,
      totalPongLoss: 42,
      totalRacerWins: 39,
      totalRacerLoss: 40,
      tournamentWins: 0,
      tournamentParticipations: 4
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440010', 
      username: 'Ben_Quadinaros', 
      email: 'ben@tund.pod', 
      bio: 'Toong podracer. Engine trouble is my specialty.', 
      status: 'OFFLINE', 
      avatar: 'ben.gif',
      totalGames: 159,
      totalWins: 72,
      totalLosses: 87,
      totalDraws: 0,
      totalWinPercent: 45.3,
      points: 1200,
      totalPongWins: 35,
      totalPongLoss: 45,
      totalRacerWins: 37,
      totalRacerLoss: 42,
      tournamentWins: 0,
      tournamentParticipations: 3
    },
  ];

  const createdUsers = [];

  for (const userData of users) 
  {
    const avatarUrl = copyImageToAvatars(userData.avatar, userData.id);
    
    const user = await prisma.userProfile.create({
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        status: userData.status,
        avatarUrl: avatarUrl || '/avatars/default.jpeg',
        gameStatus: {
          create: {
            totalGames: userData.totalGames,
            totalWins: userData.totalWins,
            totalLosses: userData.totalLosses,
            totalDraws: userData.totalDraws,
            totalWinPercent: userData.totalWinPercent,
            points: userData.points,
            totalPongWins: userData.totalPongWins,
            totalPongLoss: userData.totalPongLoss,
            totalRacerWins: userData.totalRacerWins,
            totalRacerLoss: userData.totalRacerLoss,
            tournamentWins: userData.tournamentWins,
            tournamentParticipations: userData.tournamentParticipations,
          }
        }
      },
      include: { gameStatus: true }
    });

    
    createdUsers.push(user);
    console.log(
      `✅ Created user: ${user.username} (` +
      `${user.gameStatus?.totalWins}W/${user.gameStatus?.totalLosses}L, ` +
      `${user.gameStatus?.points} pts, ` +
      `${user.gameStatus?.totalWinPercent?.toFixed(1)}% WR)`
    );

  }

  console.log('\n👥 Creating friendships...\n');

  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440001', recipientId: '550e8400-e29b-41d4-a716-446655440002', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440001', recipientId: '550e8400-e29b-41d4-a716-446655440004', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440001', recipientId: '550e8400-e29b-41d4-a716-446655440005', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440001', recipientId: '550e8400-e29b-41d4-a716-446655440007', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440002', recipientId: '550e8400-e29b-41d4-a716-446655440003', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440004', recipientId: '550e8400-e29b-41d4-a716-446655440005', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440004', recipientId: '550e8400-e29b-41d4-a716-446655440006', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440004', recipientId: '550e8400-e29b-41d4-a716-446655440008', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440005', recipientId: '550e8400-e29b-41d4-a716-446655440006', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440005', recipientId: '550e8400-e29b-41d4-a716-446655440009', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440007', recipientId: '550e8400-e29b-41d4-a716-446655440010', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '550e8400-e29b-41d4-a716-446655440007', recipientId: '550e8400-e29b-41d4-a716-446655440008', status: 'ACCEPTED' } });

}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());