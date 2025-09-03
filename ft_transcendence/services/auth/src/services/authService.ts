// Core authentication logic
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as userServiceClient from '../clients/userServiceClient';
import { HttpError } from '../utils/HttpError';

const prisma = new PrismaClient();

export async function registerUser(email: string, password: string, username: string) {
  // 1. Check if user already exists (either email OR username)
  const existingUser = await prisma.authUser.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    throw new HttpError('Email or username already exists', 409);
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Create user in auth database
  const authUser = await prisma.authUser.create({
    data: {
      email,
      password: hashedPassword,
      username
    }
  });

  // 4. Create user profile in User Service
  await userServiceClient.createUserProfile(
    authUser.id,
    email,
    username
  );
}