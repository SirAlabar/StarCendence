// Logout endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';
import * as  authService  from '../services/authService';


// Logout from current session/device
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = req.body as { refreshToken: string };
  await authService.logoutUser(refreshToken);

  return reply.send({ 
    success: true, 
    message: 'Successfully logged out from this device' 
  });
}

