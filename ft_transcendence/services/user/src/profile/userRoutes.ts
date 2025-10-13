import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as userController from './userController';
import { searchUserByUsernameSchema, updateUserProfileSchema, searchUsersSchema } from './userSchema';
import { UpdateUserBody } from './user.types';
import * as userRepository from './userRepository';
import path from 'path';
import fs from 'fs/promises';

export async function userRoutes(fastify: FastifyInstance) 
{
  // Find all user profiles -- DEBUG PURPOSES
  fastify.get('/profiles',
    async (request: any, reply: any) => 
    {
      const profiles = await userRepository.findAllUserProfiles();
      return profiles;
    }
  );

  fastify.get('/profile',
    {
      preHandler: [verifyUserToken]
    },
    userController.getUserProfile
  );

  fastify.get('/profile/:username',
    {
      preHandler: [verifyUserToken],
      schema: searchUserByUsernameSchema
    },
    userController.getUserProfileByUsername
  );

  // GET /users/search - Search users by username
  fastify.get('/users/search',
    {
      preHandler: [verifyUserToken],
      schema: searchUsersSchema
    },
    userController.searchUsers
  );

  fastify.put<{ Body: UpdateUserBody }>('/profile',
    {
      preHandler: [verifyUserToken],
      schema: updateUserProfileSchema
    },
    userController.updateUserProfile
  );

  fastify.post('/profile-image',
    {
      preHandler: [verifyUserToken]
    },
    userController.uploadProfileImage
  );

  // GET /avatars/:filename - Serve avatar files
  fastify.get('/avatars/:filename', async (request, reply) => 
  {
    const { filename } = request.params as { filename: string };
    
    // Security: prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) 
    {
      return reply.status(400).send({ error: 'Invalid filename' });
    }
    
    const avatarPath = path.join(__dirname, '../../uploads/avatars', filename);
    
    try 
    {
      // Check if file exists
      await fs.access(avatarPath);
      
      // Read file
      const fileBuffer = await fs.readFile(avatarPath);
      
      // Determine content type from extension
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream';
      
      // Send file with CORS headers
      return reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=31536000')
        .header('Access-Control-Allow-Origin', '*')  // Add this
        .header('Cross-Origin-Resource-Policy', 'cross-origin')  // Add this
        .send(fileBuffer);
    } 
    catch (error) 
    {
      console.error('Avatar file not found:', avatarPath, error);
      return reply.status(404).send({ 
        error: 'Avatar not found',
        filename: filename 
      });
    }
  });
}