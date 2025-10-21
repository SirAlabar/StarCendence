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
    { email: 'anakin@force.com', username: 'Anakin Skywalker', password: 'Anakin@@1234' },
    { email: 'padme@nabooprincess.com', username: 'Padmé Amidala', password: 'Padme@@1234' },
    { email: 'vader@empire.gov', username: 'Darth Vader', password: 'Vader@@1234' },
    { email: 'sebulba@malastare.pod', username: 'Sebulba', password: 'Sebulba@@1234' },
    { email: 'gasgano@troiken.pod', username: 'Gasgano', password: 'Gasgano@@1234' },
    { email: 'teemto@moonus.pod', username: 'Teemto Pagalies', password: 'Teemto@@1234' },
    { email: 'ratts@aleen.pod', username: 'Ratts Tyerell', password: 'Ratts@@1234' },
    { email: 'ebe@ryvellia.pod', username: 'Ebe Endocott', password: 'Ebe@@1234' },
    { email: 'mars@phuii.pod', username: 'Mars Guo', password: 'Mars@@1234' },
    { email: 'ben@tund.pod', username: 'Ben Quadinaros', password: 'Ben@@1234' },
  ];

  for (const user of users) 
  {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.authUser.create({
      data: {
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