import { FastifyInstance } from 'fastify';
import * as  authSchema  from './authSchema';
import { verifyTempToken, verifyUserToken } from '../middleware/authMiddleware';
import * as authController from './authController';

export async function authRoutes(fastify: FastifyInstance){
  fastify.post('/register',
  {
    schema: authSchema.registerSchema
  },
  authController.register);

  fastify.post('/login',
  {
    schema: authSchema.loginSchema
  },
  authController.login);

  fastify.post('/login/2fa-verify',
  {
    preHandler: [verifyTempToken],
    schema: authSchema.twoFAVerifySchema
  },
  authController.verifyTwoFA);

  fastify.post('/logout',
  {
    preHandler: [verifyUserToken],
  },
  authController.logout);

  fastify.patch('/update-password',
  {
    preHandler: [verifyUserToken],
    schema: authSchema.updatePasswordSchema
  },
  authController.updatePassword);

  fastify.get('/profile',
  {
    preHandler: [verifyUserToken],
  },
  authController.getProfile);
}
