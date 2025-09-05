// 2FA management
import { FastifyReply, FastifyRequest } from 'fastify';
import { HttpError } from '../utils/HttpError';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup 2FA: Generate secret and QR code
export async function setupTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) throw new HttpError('Unauthorized', 401);
  const secret = speakeasy.generateSecret({
    name: `StarCendence (${user.email})`
  });

  // Save secret temporarily
  await prisma.authUser.update({
    where: { id: user.sub },
    data: { twoFactorSecret: secret.base32 }
  });

  const otpauthUrl = secret.otpauth_url;
  const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);

  return reply.send({
    otpauthUrl,
    qrCodeDataURL,
    secret: secret.base32
  });
}

// Verify 2FA: User submits TOTP code
export async function verifyTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) throw new HttpError('Unauthorized', 401);
  const { token } = req.body as { token: string };

  const dbUser = await prisma.authUser.findUnique({
    where: { id: user.sub }
  });

  if (!dbUser?.twoFactorSecret) {
    throw new HttpError('2FA not set up', 400);
  }
  
  const verified = speakeasy.totp.verify({
    secret: dbUser.twoFactorSecret,
    encoding: 'base32',
    token
  });
  
  if (!verified) {
    throw new HttpError('Invalid 2FA code', 401);
  }
  
  await prisma.authUser.update({
    where: { id: user.sub },
    data: { twoFactorEnabled: true }
  });
  return reply.send({ success: true });
}

// Disable 2FA
export async function disableTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) throw new HttpError('Unauthorized', 401);
  
  await prisma.authUser.update({
    where: { id: user.sub },
    data: { twoFactorEnabled: false, twoFactorSecret: null }
  });

  return reply.send({ success: true });
}


