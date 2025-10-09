import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from './authService';
import { LoginRequestBody, RegisterRequestBody } from './auth.types';


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

  const token = await authService.loginUser(email, password);

  return reply.send({ token });
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

  return reply.send({
    success: true,
    message: 'Successfully logged out from this device'
  });
}






