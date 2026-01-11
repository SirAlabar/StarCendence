import { FastifyRequest, FastifyReply } from 'fastify'
import * as userService from './userService'
import { CreateUserBody } from './user.types'
import { UserStatus } from './user.types'


// POST /internal/create-user - Create new user
export async function createUser( req: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply ) {
  const { authId, email, username, oauthEnabled } = req.body
  if (!authId || !email || !username || oauthEnabled === undefined) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  await userService.createUserProfile(authId, email, username, oauthEnabled);

  const user = await userService.findUserProfileById(authId);

  return reply.status(201).send(user);
}

// PUT /internal/update-user-status - Update user status (internal)
export async function updateUser( req: FastifyRequest<{ Body: { userId: string; status: UserStatus } }>, reply: FastifyReply ) {
  const { userId, status } = req.body;
  if (!userId || status == null || status === undefined) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  const updatedUser = await userService.updateUserStatus(userId, status);

  return reply.send(updatedUser);
}

// GET /profile - Get user's profile
export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const user = await userService.getPersonalUserProfileById(userId);

  return reply.send(user);
}

// GET /profile/:username - Get user's profile by username
export async function getUserProfileByUsername(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const { username } = req.params as { username: string };
  if (!username) {
    return reply.status(400).send({ error: 'Username is required' });
  }

  const user = await userService.findUserProfileByUsername(username);

  return reply.send(user);
}

// PATCH /profile - Update user's profile
export async function updateUserProfile( req: FastifyRequest, reply: FastifyReply ) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const updatedData = req.body;

  const updatedUser = await userService.updateUserProfile(userId, updatedData);

  return reply.send(updatedUser);
}

// POST /profile-image - Upload or update user's profile image
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

// GET /users/search?q=query - Search users by username
export async function searchUsers(req: FastifyRequest, reply: FastifyReply)
{
  const userId = req.user?.sub;
  if (!userId){
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const { q } = req.query as { q?: string };
  
  if (!q || q.trim().length < 2) {
    return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
  }

  const users = await userService.searchUsers(q);
  return reply.send(users);
}

// GET /rank - Get current user's rank
export async function getUserRank(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const userRank = await userService.getUserRank(userId);
  return reply.send(userRank);
}

// PUT Update user stats after game
export async function updateUserStats(req: FastifyRequest, reply: FastifyReply) {
  const { type, mode, players, winnerUserId } = req.body as { type: any; mode: any; players: any[]; winnerUserId: string | null };

  if (!type || !mode || !players || !Array.isArray(players)) {
    return reply.status(400).send({ error: 'Missing or invalid required fields' });
  }

  await userService.updateUserStats(type, mode, players, winnerUserId);

  return reply.send({ message: 'User stats updated successfully' });
}

// PATCH /internal/update-2fa-state - Update user's two-factor authentication state (internal)
export async function updateTwoFactorState(req: FastifyRequest<{ Body: { userId: string; twoFactorEnabled: boolean } }>, reply: FastifyReply) {
  const { userId, twoFactorEnabled } = req.body;
  
  if (!userId || typeof twoFactorEnabled !== 'boolean') {
    return reply.status(400).send({ error: 'Missing or invalid required fields' });
  }

  const updatedUser = await userService.updateTwoFactorState(userId, twoFactorEnabled);

  return reply.send(updatedUser);
}

// Patch /settings - Update user's settings
export async function updateUserSettings(req: FastifyRequest, reply: FastifyReply) {
 const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  const settingsData = req.body;

  await userService.updateUserSettings(userId, settingsData);

  return reply.send({ message: 'User settings updated successfully' });
};

// DELETE /delete-user-profile - Delete user profile (internal)
export async function deleteUserProfile(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.body as { userId: string };
  console.log("Deleting user profile for userId:", userId);
  if (!userId) {
    return reply.status(400).send({ error: 'User ID is required' });
  }

  await userService.deleteUserProfile(userId);

  return reply.send({ message: 'User profile deleted successfully' });
}