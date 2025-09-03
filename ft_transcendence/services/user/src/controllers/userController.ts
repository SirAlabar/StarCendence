import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { HttpError } from '../utils/HttpError'

const prisma = new PrismaClient()

interface UserParams {
  id: string
}

interface CreateUserBody {
  authId: string
  email: string
  username: string
}

// POST /users - Create new user
export async function createUser(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  const { authId, email, username } = request.body

  // Basic validation
  if (!authId || !email || !username) {
    throw new HttpError('Auth ID, email, and username are required', 400);
  }
  
  // Create user
  const user = await prisma.userProfile.create({
    data: {
      id: authId,
      email,
      username
    }
  });

  return reply.status(201).send({ user });
}

// GET /users/:id - Get user by ID
export async function getUserById(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  const { id } = request.params

  const user = await prisma.userProfile.findUnique({
    where: { id }
  });

  if (!user) {
    throw new HttpError('User not found', 404);
  }

  return reply.send({ user });
}
