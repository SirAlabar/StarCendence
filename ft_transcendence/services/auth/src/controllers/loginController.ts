import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/authService';

interface LoginRequestBody {
  email: string;
  password: string;
}

// Login user and return JWT
export async function login(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
  const { email, password } = req.body;

  const token = await authService.loginUser(email, password);

  return reply.send({ token });
}

// Verify 2FA code and return JWTs
export async function verifyTwoFA(req: FastifyRequest, reply: FastifyReply) {
  const tempToken = req.headers['authorization']?.split(' ')[1];
  if (!tempToken) {
    return reply.status(400).send({ error: 'Missing or invalid authorization header' });
  }

  const { twoFACode } = req.body as { twoFACode: string };

  const tokens = await authService.verifyTwoFA(tempToken, twoFACode);

  return reply.send({ tokens });
}
