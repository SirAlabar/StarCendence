// 2FA management
import { FastifyReply, FastifyRequest } from 'fastify';
import * as twoFactorService from '../services/twoFactorService';

// Setup 2FA: Generate secret and QR code
export async function setupTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  await twoFactorService.setupTwoFactor(req, reply);
}

// Verify 2FA: User submits TOTP code
export async function verifyTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  await twoFactorService.verifyTwoFactor(req, reply);
}

// Disable 2FA
export async function disableTwoFactor(req: FastifyRequest, reply: FastifyReply) {
  await twoFactorService.disableTwoFactor(req, reply);
}
