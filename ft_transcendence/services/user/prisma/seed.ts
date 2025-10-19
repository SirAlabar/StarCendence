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
    { id: '1', username: 'Anakin Skywalker', email: 'anakin@force.com', bio: 'The Chosen One. Podracer champion turned Jedi.', status: 'ONLINE', avatar: 'anakin.gif' },
    { id: '2', username: 'Padmé Amidala', email: 'padme@nabooprincess.com', bio: 'Former Queen of Naboo. Fearless senator.', status: 'ONLINE', avatar: 'padme.gif' },
    { id: '3', username: 'Darth Vader', email: 'vader@empire.gov', bio: 'Lord of the Sith. Wears black. Breathing enthusiast.', status: 'OFFLINE', avatar: 'vader.gif' },
    { id: '4', username: 'Sebulba', email: 'sebulba@malastare.pod', bio: 'Dug podracer pilot. Hates Skywalker.', status: 'ONLINE', avatar: 'sebulba.gif' },
    { id: '5', username: 'Gasgano', email: 'gasgano@troiken.pod', bio: 'Xexto podracer with 24 fingers. Speed is everything.', status: 'ONLINE', avatar: 'gasgano.jpg' },
    { id: '6', username: 'Teemto Pagalies', email: 'teemto@moonus.pod', bio: 'Veknoid podracer. Cool under pressure.', status: 'OFFLINE', avatar: 'teemto.jpg' },
    { id: '7', username: 'Ratts Tyerell', email: 'ratts@aleen.pod', bio: 'Tiny but fierce Aleena podracer.', status: 'ONLINE', avatar: 'ratts.jpg' },
    { id: '8', username: 'Ebe Endocott', email: 'ebe@ryvellia.pod', bio: 'Rybet podracer from Ando Prime.', status: 'OFFLINE', avatar: 'ebe.jpg' },
    { id: '9', username: 'Mars Guo', email: 'mars@phuii.pod', bio: 'Phuii podracer with a need for speed.', status: 'ONLINE', avatar: 'mars.gif' },
    { id: '10', username: 'Ben Quadinaros', email: 'ben@tund.pod', bio: 'Toong podracer. Engine trouble is my specialty.', status: 'OFFLINE', avatar: 'ben.gif' },
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
        avatarUrl: avatarUrl || null,
      },
    });
    
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.username}`);
  }

  console.log('\n👥 Creating friendships...\n');

  await prisma.friendship.create({ data: { senderId: '1', recipientId: '2', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '1', recipientId: '4', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '1', recipientId: '5', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '1', recipientId: '7', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '2', recipientId: '3', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '4', recipientId: '5', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '4', recipientId: '6', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '4', recipientId: '8', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '5', recipientId: '6', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '5', recipientId: '9', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '7', recipientId: '10', status: 'ACCEPTED' } });
  await prisma.friendship.create({ data: { senderId: '7', recipientId: '8', status: 'ACCEPTED' } });

  console.log('\n✅ Seed complete – 10 users, avatars, and friendships created!');
}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());