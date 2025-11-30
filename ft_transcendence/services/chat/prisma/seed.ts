import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() 
{
  const existingUsers = await prisma.user.count();
  
  if (existingUsers > 0) 
  {
    console.log('⚠️  Chat database already has users. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding chat database...');

  const users = [
    { id: '550e8400-e29b-41d4-a716-446655440001', username: 'Anakin_Skywalker' },
    { id: '550e8400-e29b-41d4-a716-446655440002', username: 'Padme_Amidala' },
    { id: '550e8400-e29b-41d4-a716-446655440003', username: 'Darth_Vader' },
    { id: '550e8400-e29b-41d4-a716-446655440004', username: 'Sebulba' },
    { id: '550e8400-e29b-41d4-a716-446655440005', username: 'Gasgano' },
    { id: '550e8400-e29b-41d4-a716-446655440006', username: 'Teemto_Pagalies' },
    { id: '550e8400-e29b-41d4-a716-446655440007', username: 'Ratts_Tyerell' },
    { id: '550e8400-e29b-41d4-a716-446655440008', username: 'Ebe_Endocott' },
    { id: '550e8400-e29b-41d4-a716-446655440009', username: 'Mars_Guo' },
    { id: '550e8400-e29b-41d4-a716-446655440010', username: 'Ben_Quadinaros' },
  ];

  for (const user of users) 
  {
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
      },
    });
  }
}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());