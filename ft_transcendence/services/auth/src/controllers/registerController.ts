import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/authService';

interface RegisterRequestBody {
  email: string;
  password: string;
  username: string;
}

// Register new user
export async function register(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
  const { email, password, username } = req.body;

  await authService.registerUser(email, password, username);

  return reply.status(201).send({ message: 'User registered successfully' });
}

