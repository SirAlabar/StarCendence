import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() 
{
  const existingUsers = await prisma.authUser.count();
  
  if (existingUsers > 0) 
  {
    console.log('⚠️  Auth database already has users. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding auth database...');

  const users = [
    { id: '550e8400-e29b-41d4-a716-446655440001', email: 'anakin@force.com', username: 'Anakin', password: 'Anakin@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440002', email: 'padme@nabooprincess.com', username: 'Padmé', password: 'Padme@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440003', email: 'vader@empire.gov', username: 'Darth', password: 'Vader@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440004', email: 'sebulba@malastare.pod', username: 'Sebulba', password: 'Sebulba@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440005', email: 'gasgano@troiken.pod', username: 'Gasgano', password: 'Gasgano@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440006', email: 'teemto@moonus.pod', username: 'Teemto', password: 'Teemto@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440007', email: 'ratts@aleen.pod', username: 'Ratts', password: 'Ratts@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440008', email: 'ebe@ryvellia.pod', username: 'Ebe', password: 'Ebe@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440009', email: 'mars@phuii.pod', username: 'Mars', password: 'Mars@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440010', email: 'ben@tund.pod', username: 'Ben', password: 'Ben@@1234' },
    { id: '550e8400-e29b-41d4-a716-446655440011', email: 'test@test.com', username: 'test', password: 'Test123.' },
  ];

  for (const user of users) 
  {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.authUser.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        password: hashedPassword,
      },
    });
  }

  console.log('✅ Auth seed complete!');
  console.log('Default password pattern: [Username]@@1234');
  console.log('Examples: Anakin@@1234, Ben@@1234, Padme@@1234');
}

main()
  .catch((e) => 
  {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());