// Registration logic

import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/authService';

export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'username'],
    properties: {
      email: { 
        type: 'string', 
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        maxLength: 255
      },
      password: { 
        type: 'string',
        minLength: 8,
        maxLength: 72,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.])[A-Za-z\\d@$!%*?&.]{8,}$',
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9._-]+$',
      }
    }
  },
};

interface RegisterRequestBody {
  email: string;
  password: string;
  username: string;
}

export async function register(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
  const { email, password, username } = req.body;

  await authService.registerUser(email, password, username);

  return reply.status(201).send({ message: 'User registered successfully' });
}

