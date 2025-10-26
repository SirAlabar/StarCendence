import * as twoFactorRepository from './twoFactorRepository';
import { HttpError } from '../utils/HttpError';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { FastifyRequest, FastifyReply } from 'fastify';

// Setup 2FA: Generate secret and QR code
export async function setupTwoFactor(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user;
    if (!user) {
        throw new HttpError('Unauthorized', 401);
    }

    const isEnabled = await twoFactorRepository.isTwoFactorEnabled(user.sub);
    if (isEnabled) {
        throw new HttpError('2FA is already enabled', 400);
    }

    const secret = speakeasy.generateSecret({
        name: `StarCendence (${user.email})`
    });

    await twoFactorRepository.updateTwoFactorSecret(user.sub, secret.base32);

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
    if (!user) {
        throw new HttpError('Unauthorized', 401);
    }
    
    const { token } = req.body as { token: string };

    const userSecret = await twoFactorRepository.getTwoFactorSecret(user.sub);
    if (!userSecret) {
        throw new HttpError('2FA not set up', 400);
    }
    
    const verified = speakeasy.totp.verify({
        secret: userSecret,
        encoding: 'base32',
        token
    });

    if (!verified) {
        throw new HttpError('Invalid 2FA token', 400);
    }

    const isEnabled = await twoFactorRepository.isTwoFactorEnabled(user.sub);
    if (isEnabled) {
        throw new HttpError('2FA is already enabled', 400);
    }

    await twoFactorRepository.enableTwoFactor(user.sub);
    
    return reply.send({ success: true });
}

// Disable 2FA
export async function disableTwoFactor(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user;
    if (!user) {
        throw new HttpError('Unauthorized', 401);
    }
    
    await twoFactorRepository.disableTwoFactor(user.sub);
    return reply.send({ success: true });
}
