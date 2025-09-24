import { FastifyRequest, FastifyReply } from 'fastify';
import * as  authService  from '../services/authService';
import { HttpError } from '../utils/HttpError';

// Logout from current session
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const accessToken = req.headers['authorization']?.split(' ')[1];
  if (!accessToken) {
    throw new HttpError('Access token is required', 400);
  }

  await authService.logoutUser(accessToken);

  return reply.send({ 
    success: true, 
    message: 'Successfully logged out from this device' 
  });
}

