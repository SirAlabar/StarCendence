import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import * as userService from '../services/userService'

const prisma = new PrismaClient()

interface UserParams {
  id: string
}

interface CreateUserBody {
  authId: string
  email: string
  username: string
}

// POST /internal/create-user - Create new user
export async function createUser( req: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply ) {
  const { authId, email, username } = req.body
  
  await userService.createUserProfile(authId, email, username);

  const user = await userService.findUserProfileById(authId);

  return reply.status(201).send({ user });
}

// GET /internal/users/:id - Get user by ID
export async function getUserById(req: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply ) {
  const { id } = req.params

  const user = await userService.findUserProfileById(id);

  return reply.send({ user });
}

// GET /profile - Get current user's profile (requires authentication)
export async function getCurrentUserProfile(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const user = await userService.findUserProfileById(userId);
  
  return reply.send({ user });
}