import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from './authService';
import { LoginRequestBody, RegisterRequestBody } from './auth.types';
import { TokenPair, TokenType } from '../token/token.types';
import { updateUserStatus } from '../clients/userServiceClient';
import * as userRepository from '../auth/userRepository';


// POST /register - Register a new user
export async function register(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return reply.status(400).send({ error: 'Email, password, and username are required' });
  }

  await authService.registerUser(email, password, username);

  return reply.status(201).send({ message: 'User registered successfully' });
}

// POST /login - Authenticate user and return JWT
export async function login(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password are required' });
  }

  const token: Partial<TokenPair> = await authService.loginUser(email, password);
  if (token.type === TokenType.ACCESS) {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    await updateUserStatus(user.id, 'ONLINE');
  }

  return reply.send(token);
}

// POST /2fa/verify - Verify 2FA code and return JWT tokens
export async function verifyTwoFA(req: FastifyRequest, reply: FastifyReply) {
  const tempToken = req.headers['authorization']?.split(' ')[1];
  if (!tempToken) {
    return reply.status(400).send({ error: 'Missing or invalid authorization header' });
  }

  const { twoFACode } = req.body as { twoFACode: string };
  if (!twoFACode) {
    return reply.status(400).send({ error: '2FA code is required' });
  }

  const tokens = await authService.verifyTwoFA(tempToken, twoFACode);

  return reply.send({ tokens });
}


// POST /logout - Invalidate the current JWT token
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const accessToken = req.headers['authorization']?.split(' ')[1];
  if (!accessToken) {
    return reply.status(400).send({ error: 'Access token is required' });
  }

  await authService.logoutUser(accessToken);
  
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(400).send({ error: 'Invalid user' });
  }
  await updateUserStatus(userId, 'OFFLINE');

  return reply.send({
    success: true,
    message: 'Successfully logged out from this device'
  });
}






