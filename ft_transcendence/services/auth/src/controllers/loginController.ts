// Login endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/authService';

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { 
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 100
      },
    }
  }
};

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function login(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
  const { email, password } = req.body;

  const token = await authService.loginUser(email, password);

  return reply.send({ token });
}