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
    { id: '550e8400-e29b-41d4-a716-446655440001', username: 'Anakin', email: 'anakin@force.com', bio: 'The Chosen One. Podracer champion turned Jedi.', status: 'OFFLINE', avatar: 'anakin.gif' },
    { id: '550e8400-e29b-41d4-a716-446655440002', username: 'Padmé', email: 'padme@nabooprincess.com', bio: 'Former Queen of Naboo. Fearless senator.', status: 'OFFLINE', avatar: 'padme.gif' },
    { id: '550e8400-e29b-41d4-a716-446655440003', username: 'Darth', email: 'vader@empire.gov', bio: 'Lord of the Sith. Wears black. Breathing enthusiast.', status: 'OFFLINE', avatar: 'vader.gif' },
    { id: '550e8400-e29b-41d4-a716-446655440004', username: 'Sebulba', email: 'sebulba@malastare.pod', bio: 'Dug podracer pilot. Hates Skywalker.', status: 'OFFLINE', avatar: 'sebulba.gif' },
    { id: '550e8400-e29b-41d4-a716-446655440005', username: 'Gasgano', email: 'gasgano@troiken.pod', bio: 'Xexto podracer with 24 fingers. Speed is everything.', status: 'OFFLINE', avatar: 'gasgano.jpg' },
    { id: '550e8400-e29b-41d4-a716-446655440006', username: 'Teemto', email: 'teemto@moonus.pod', bio: 'Veknoid podracer. Cool under pressure.', status: 'OFFLINE', avatar: 'teemto.jpg' },
    { id: '550e8400-e29b-41d4-a716-446655440007', username: 'Ratts', email: 'ratts@aleen.pod', bio: 'Tiny but fierce Aleena podracer.', status: 'OFFLINE', avatar: 'ratts.jpg' },
    { id: '550e8400-e29b-41d4-a716-446655440008', username: 'Ebe', email: 'ebe@ryvellia.pod', bio: 'Rybet podracer from Ando Prime.', status: 'OFFLINE', avatar: 'ebe.jpg' },
    { id: '550e8400-e29b-41d4-a716-446655440009', username: 'Mars', email: 'mars@phuii.pod', bio: 'Phuii podracer with a need for speed.', status: 'OFFLINE', avatar: 'mars.gif' },
    { id: '550e8400-e29b-41d4-a716-446655440010', username: 'Ben', email: 'ben@tund.pod', bio: 'Toong podracer. Engine trouble is my specialty.', status: 'OFFLINE', avatar: 'ben.gif' },
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
      },
    });
    
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.username}`);
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

  console.log('\n✅ Seed complete – 10 users, avatars, and friendships created!');
}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());