// Verify token endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';

// Simply return success if token is valid (set by authMiddleware)
export async function verify(req: FastifyRequest, reply: FastifyReply) {
  return { success: true, user: req.user };
}