// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() 
{
  // Check if users already exist
  const existingUsers = await prisma.userProfile.count();
  
  if (existingUsers > 0) 
  {
    console.log('⚠️  Database already has users. Skipping seed.');
    console.log(`Found ${existingUsers} existing users.`);
    return;
  }

  console.log('🌱 Starting database seed...');

  // Create users
  const anakin = await prisma.userProfile.create({
    data: {
      id: '1',
      username: 'Anakin Skywalker',
      email: 'anakin@force.com',
      bio: 'The Chosen One. Podracer champion turned Jedi.',
      avatarUrl: '/images/users/anakin.gif',
      status: 'ONLINE',
    },
  });

  const padme = await prisma.userProfile.create({
    data: {
      id: '2',
      username: 'Padmé Amidala',
      email: 'padme@nabooprincess.com',
      bio: 'Former Queen of Naboo. Fearless senator.',
      avatarUrl: '/images/users/padme.gif',
      status: 'ONLINE',
    },
  });

  const vader = await prisma.userProfile.create({
    data: {
      id: '3',
      username: 'Darth Vader',
      email: 'vader@empire.gov',
      bio: 'Lord of the Sith. Wears black. Breathing enthusiast.',
      avatarUrl: '/images/users/vader.gif',
      status: 'OFFLINE',
    },
  });

  const sebulba = await prisma.userProfile.create({
    data: {
      id: '4',
      username: 'Sebulba',
      email: 'sebulba@malastare.pod',
      bio: 'Dug podracer pilot. Hates Skywalker.',
      avatarUrl: '/images/users/sebulba.gif',
      status: 'ONLINE',
    },
  });

  const gasgano = await prisma.userProfile.create({
    data: {
      id: '5',
      username: 'Gasgano',
      email: 'gasgano@troiken.pod',
      bio: 'Xexto podracer with 24 fingers. Speed is everything.',
      avatarUrl: '/images/users/gasgano.jpg',
      status: 'ONLINE',
    },
  });

  const teemto = await prisma.userProfile.create({
    data: {
      id: '6',
      username: 'Teemto Pagalies',
      email: 'teemto@moonus.pod',
      bio: 'Veknoid podracer. Cool under pressure.',
      avatarUrl: '/images/users/teemto.jpg',
      status: 'OFFLINE',
    },
  });

  const ratts = await prisma.userProfile.create({
    data: {
      id: '7',
      username: 'Ratts Tyerell',
      email: 'ratts@aleen.pod',
      bio: 'Tiny but fierce Aleena podracer.',
      avatarUrl: '/images/users/ratts.jpg',
      status: 'ONLINE',
    },
  });

  const ebe = await prisma.userProfile.create({
    data: {
      id: '8',
      username: 'Ebe Endocott',
      email: 'ebe@ryvellia.pod',
      bio: 'Rybet podracer from Ando Prime.',
      avatarUrl: '/images/users/ebe.jpg',
      status: 'OFFLINE',
    },
  });

  const mars = await prisma.userProfile.create({
    data: {
      id: '9',
      username: 'Mars Guo',
      email: 'mars@phuii.pod',
      bio: 'Phuii podracer with a need for speed.',
      avatarUrl: '/images/users/mars.gif',
      status: 'ONLINE',
    },
  });

  const ben = await prisma.userProfile.create({
    data: {
      id: '10',
      username: 'Ben Quadinaros',
      email: 'ben@tund.pod',
      bio: 'Toong podracer. Engine trouble is my specialty.',
      avatarUrl: '/images/users/ben.gif',
      status: 'OFFLINE',
    },
  });

  // Create friendships
  await prisma.friendship.create({
    data: {
      senderId: anakin.id,
      recipientId: padme.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: anakin.id,
      recipientId: sebulba.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: anakin.id,
      recipientId: gasgano.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: anakin.id,
      recipientId: ratts.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: padme.id,
      recipientId: vader.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: sebulba.id,
      recipientId: gasgano.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: sebulba.id,
      recipientId: teemto.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: sebulba.id,
      recipientId: ebe.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: gasgano.id,
      recipientId: teemto.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: gasgano.id,
      recipientId: mars.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: ratts.id,
      recipientId: ben.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      senderId: ratts.id,
      recipientId: ebe.id,
      status: 'ACCEPTED',
    },
  });

  console.log('✅ Seed complete – 10 users and friendships created!');
}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());