import { FastifyRequest, FastifyReply } from 'fastify'
import * as userService from './userService'
import { CreateUserBody, UpdateUserBody } from './user.types'
import { UserProfile, UserStatus } from './user.types'


// POST /internal/create-user - Create new user
export async function createUser( req: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply ) {
  const { authId, email, username, oauthEnabled } = req.body
  if (!authId || !email || !username || oauthEnabled === undefined) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  await userService.createUserProfile(authId, email, username, oauthEnabled);

  const user: UserProfile = await userService.findUserProfileById(authId);

  return reply.status(201).send(user);
}

// PUT /internal/update-user-status - Update user status (internal)
export async function updateUser( req: FastifyRequest<{ Body: { userId: string; status: UserStatus } }>, reply: FastifyReply ) {
  const { userId, status } = req.body;
  if (!userId || status == null || status === undefined) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  const updatedUser: UserProfile = await userService.updateUserStatus(userId, status);

  return reply.send(updatedUser);
}

// GET /profile - Get user's profile (requires authentication)
export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const user: UserProfile = await userService.findUserProfileById(userId);

  return reply.send(user);
}

// GET /profile/:username - Get user's profile by username (requires authentication)
export async function getUserProfileByUsername(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const { username } = req.params as { username: string };
  if (!username) {
    return reply.status(400).send({ error: 'Username is required' });
  }

  const user: UserProfile = await userService.findUserProfileByUsername(username);

  return reply.send(user);
}

// PUT /profile - Update user's profile (requires authentication)
export async function updateUserProfile( req: FastifyRequest<{ Body: UpdateUserBody }>, reply: FastifyReply ) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const updatedData = req.body;
  const updatedUser: UserProfile = await userService.updateUserProfile(userId, updatedData);

  return reply.send(updatedUser);
}

// POST /profile-image - Upload or update user's profile image (requires authentication)
export async function uploadProfileImage(req: FastifyRequest, reply: FastifyReply) 
{
  const userId = req.user?.sub;
  if (!userId) 
  {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const image = await req.file({ limits: { fileSize: 5 * 1024 * 1024 } });
  if (!image) 
  {
    return reply.status(400).send({ error: 'No image provided' });
  }

  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimeTypes.includes(image.mimetype)) 
  {
    return reply.status(400).send({
      error: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'
    });
  }

  const imageUrl = await userService.uploadProfileImage(userId, image);
  
  if (!imageUrl) 
  {
    return reply.status(500).send({ error: 'Failed to upload image' });
  }

  return reply.send({ avatarUrl: imageUrl });
}

// GET /users/search?q=query - Search users by username (requires authentication)
export async function searchUsers(req: FastifyRequest, reply: FastifyReply)
{
  const userId = req.user?.sub;
  if (!userId)
  {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const { q } = req.query as { q?: string };
  
  if (!q || q.trim().length < 2)
  {
    return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
  }

  const users = await userService.searchUsers(q);
  return reply.send(users);
}

// GET /rank - Get current user's rank
export async function getUserRank(req: FastifyRequest, reply: FastifyReply)
{
  const userId = req.user?.sub;
  if (!userId)
  {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const userRank = await userService.getUserRank(userId);
  return reply.send(userRank);
}

// PUT Update user stats after game
export async function updateUserStats(
  req: FastifyRequest<{ Body: { userId: string; won: boolean; pointsEarned: number } }>, 
  reply: FastifyReply
)
{
  const { userId, won, pointsEarned } = req.body;
  
  if (!userId || typeof won !== 'boolean' || typeof pointsEarned !== 'number') 
  {
    return reply.status(400).send({ error: 'Missing or invalid required fields' });
  }

  const updatedUser = await userService.updateUserStats(userId, won, pointsEarned);
  return reply.send(updatedUser);
}

// PATCH /internal/update-2fa-state - Update user's two-factor authentication state (internal)
export async function updateTwoFactorState(req: FastifyRequest<{ Body: { userId: string; twoFactorEnabled: boolean } }>, reply: FastifyReply) {
  const { userId, twoFactorEnabled } = req.body;
  
  if (!userId || typeof twoFactorEnabled !== 'boolean') {
    return reply.status(400).send({ error: 'Missing or invalid required fields' });
  }

  const updatedUser: UserProfile = await userService.updateTwoFactorState(userId, twoFactorEnabled);

  return reply.send(updatedUser);
}