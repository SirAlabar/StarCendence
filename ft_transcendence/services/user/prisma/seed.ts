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
      totalWins: 145,
      totalLosses: 32,
      points: 2450
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440002', 
      username: 'Padme_Amidala', 
      email: 'padme@nabooprincess.com', 
      bio: 'Former Queen of Naboo. Fearless senator.', 
      status: 'OFFLINE', 
      avatar: 'padme.gif',
      totalWins: 132,
      totalLosses: 45,
      points: 2180
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440003', 
      username: 'Darth_Vader', 
      email: 'vader@empire.gov', 
      bio: 'Lord of the Sith. Wears black. Breathing enthusiast.', 
      status: 'OFFLINE', 
      avatar: 'vader.gif',
      totalWins: 118,
      totalLosses: 51,
      points: 1920
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440004', 
      username: 'Sebulba', 
      email: 'sebulba@malastare.pod', 
      bio: 'Dug podracer pilot. Hates Skywalker.', 
      status: 'OFFLINE', 
      avatar: 'sebulba.gif',
      totalWins: 105,
      totalLosses: 60,
      points: 1800
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440005', 
      username: 'Gasgano', 
      email: 'gasgano@troiken.pod', 
      bio: 'Xexto podracer with 24 fingers. Speed is everything.', 
      status: 'OFFLINE', 
      avatar: 'gasgano.jpg',
      totalWins: 98,
      totalLosses: 65,
      points: 1700
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440006', 
      username: 'Teemto_Pagalies', 
      email: 'teemto@moonus.pod', 
      bio: 'Veknoid podracer. Cool under pressure.', 
      status: 'OFFLINE', 
      avatar: 'teemto.jpg',
      totalWins: 92,
      totalLosses: 68,
      points: 1600
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440007', 
      username: 'Ratts_Tyerell', 
      email: 'ratts@aleen.pod', 
      bio: 'Tiny but fierce Aleena podracer.', 
      status: 'OFFLINE', 
      avatar: 'ratts.jpg',
      totalWins: 87,
      totalLosses: 73,
      points: 1500
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440008', 
      username: 'Ebe_Endocott', 
      email: 'ebe@ryvellia.pod', 
      bio: 'Rybet podracer from Ando Prime.', 
      status: 'OFFLINE', 
      avatar: 'ebe.jpg',
      totalWins: 81,
      totalLosses: 78,
      points: 1400
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440009', 
      username: 'Mars_Guo', 
      email: 'mars@phuii.pod', 
      bio: 'Phuii podracer with a need for speed.', 
      status: 'OFFLINE', 
      avatar: 'mars.gif',
      totalWins: 76,
      totalLosses: 82,
      points: 1300
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440010', 
      username: 'Ben_Quadinaros', 
      email: 'ben@tund.pod', 
      bio: 'Toong podracer. Engine trouble is my specialty.', 
      status: 'OFFLINE', 
      avatar: 'ben.gif',
      totalWins: 72,
      totalLosses: 87,
      points: 1200
    },
  ];

  const createdUsers = [];

  for (const userData of users) 
  {
    const avatarUrl = copyImageToAvatars(userData.avatar, userData.id);
    
    const user = await prisma.userProfile.create(
    {
      data: 
      {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        status: userData.status,
        avatarUrl: avatarUrl || '/avatars/default.jpeg',
        totalWins: userData.totalWins,
        totalLosses: userData.totalLosses,
        points: userData.points
      },
    });
    
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.username} (${user.totalWins}W/${user.totalLosses}L, ${user.points} pts)`);
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