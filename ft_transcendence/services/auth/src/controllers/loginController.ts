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