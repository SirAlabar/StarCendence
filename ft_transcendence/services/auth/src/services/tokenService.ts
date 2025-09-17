import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { HttpError } from '../utils/HttpError';
import { readFileSync } from 'fs';
import * as refreshTokenRepository from '../repositories/refreshTokenRepository';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Load JWT secret from Docker secret file
function getJwtSecret(): string {
	const jwtSecret: string = readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
	if (!jwtSecret) {
		throw new HttpError('JWT secret is not configured', 500);
	}
  return jwtSecret;
}

// Generate access and refresh tokens
export async function generateTokens(userId: string, email: string, username: string): Promise<TokenPair> {
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
      expiresIn: '15m',
      issuer: 'transcendence-auth'
    }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');

  const refreshExpiresDays = 7;
  const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);
  
  await refreshTokenRepository.create(userId, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

// Verify access token (for protected routes)
export async function verifyAccessToken(token: string) {
  const jwtSecret = getJwtSecret();

  return jwt.verify(token, jwtSecret) as jwt.JwtPayload;
}

// Verify refresh token (for token rotation)
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