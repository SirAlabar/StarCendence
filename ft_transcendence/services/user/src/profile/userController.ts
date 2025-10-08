import { FastifyRequest, FastifyReply } from 'fastify'
import * as userService from './userService'
import { CreateUserBody, UpdateUserBody } from './user.types'
import { UserProfile } from './user.types'

// POST /internal/create-user - Create new user
export async function createUser( req: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply ) {
  const { authId, email, username } = req.body
  
  await userService.createUserProfile(authId, email, username);

  const user: UserProfile = await userService.findUserProfileById(authId);

  return reply.status(201).send({ user });
}

// GET /profile - Get user's profile (requires authentication)
export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const user: UserProfile = await userService.findUserProfileById(userId);

  return reply.send({ user });
}

// PUT /profile - Update user's profile (requires authentication)
export async function updateUserProfile( req: FastifyRequest<{ Body: UpdateUserBody }>, reply: FastifyReply ) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const updatedData = req.body;
  const updatedUser: UserProfile = await userService.updateUserProfile(userId, updatedData);

  if (!updatedUser) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send({ user: updatedUser });
}

// POST /profile-image - Upload or update user's profile image (requires authentication)
export async function uploadProfileImage(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const image = await req.file({ limits: { fileSize: 5 * 1024 * 1024 } });
  if (!image) {
    return reply.status(400).send({ error: 'No image provided' });
  }

  const imageUrl: Promise<string> = userService.uploadProfileImage(userId, image);
  if (!imageUrl) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send({ imageUrl });
}
