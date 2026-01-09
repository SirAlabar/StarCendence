import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { HttpError } from '../utils/HttpError';
import * as refreshTokenRepository from './refreshTokenRepository';
import { TokenType } from './token.types';
import { getJwtSecret } from '../utils/getSecrets';

// Generate access and refresh tokens
export async function generateTokens(userId: string, email: string, username: string) {
  const jwtSecret = getJwtSecret();
  
  const accessToken = jwt.sign(
    { 
      sub: userId, 
      email,
      username,
      type: 'access'
    },
    jwtSecret,
    { 
      // expiresIn: '15m',
      issuer: 'transcendence-auth'
    }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');

  const refreshExpiresDays = 7;
  const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);
  
  await refreshTokenRepository.create(userId, refreshToken, expiresAt);

  return { accessToken, refreshToken, type: TokenType.ACCESS };
}

// Verify access token
export async function verifyAccessToken(token: string) {
  const jwtSecret = getJwtSecret();

  return jwt.verify(token, jwtSecret) as jwt.JwtPayload;
}

// Verify refresh token
export async function verifyRefreshToken(token: string) {
  const refreshToken = await refreshTokenRepository.findByToken(token);

  if (!refreshToken) {
    throw new HttpError('Invalid refresh token', 401);
  }

  if (refreshToken.expiresAt < new Date()) {
    await refreshTokenRepository.deleteById(refreshToken.id);
    throw new HttpError('Refresh token expired', 401);
  }

  return refreshToken;
}

// Refresh access token using a valid refresh token
export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    throw new HttpError('Refresh token is required', 400);
  }

  const refreshTokenRecord = await verifyRefreshToken(refreshToken);
  
  await refreshTokenRepository.deleteByToken(refreshToken);

  if (!refreshTokenRecord.user.id || !refreshTokenRecord.user.email || !refreshTokenRecord.user.username) {
    throw new HttpError('Incomplete user data', 500);
  }

  const newTokens = await generateTokens(
    refreshTokenRecord.user.id,
    refreshTokenRecord.user.email,
    refreshTokenRecord.user.username
  );

  return newTokens;
}

// Revoke all refresh tokens for a user
export async function revokeAllRefreshTokensForUser(userId: string) {
  await refreshTokenRepository.deleteById(userId);
}

// Generate a temporary token for 2FA verification
export async function generateTempToken(userId: string): Promise<string> {
  const jwtSecret = getJwtSecret();

  const tempToken = jwt.sign(
    {
      sub: userId,
      type: 'temp'
    },
    jwtSecret,
    {
      expiresIn: '10m',
      issuer: 'transcendence-auth'
    }
  );

  return tempToken;
}

// Verify 2FA code using the user's secret
export async function verifyTwoFACode(twoFactorSecret: string, code: string): Promise<boolean> {
  const verified = speakeasy.totp.verify({
    secret: twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });
  
  return verified;
}

// Generate a partial OAuth token for setting username
export async function generatePartialOAuthToken(oauthId: string, email: string): Promise<string> {
  const jwtSecret = getJwtSecret();

  const partialToken = jwt.sign(
    {
      sub: oauthId,
      email,
      type: 'partial_oauth'
    },
    jwtSecret,
    {
      expiresIn: '10m',
      issuer: 'transcendence-auth'
    }
  );

  return partialToken;
}
