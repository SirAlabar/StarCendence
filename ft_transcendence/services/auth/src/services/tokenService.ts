// JWT token management
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
  // Get JWT secret from environment
  const jwtSecret = getJwtSecret();
  
  // Generate short-lived access token (15 minutes)
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

  // Generate random refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');

  // Store refresh token in database (expires in 7 days by default)
  const refreshExpiresDays = 7;
  const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);
  
  await refreshTokenRepository.create(userId, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

// Verify access token (for protected routes)
export async function verifyAccessToken(token: string) {
  const jwtSecret = getJwtSecret();

  const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
  return decoded;
}

// Verify refresh token (for token rotation)
export async function verifyRefreshToken(token: string) {
  // Check if refresh token exists and is not expired
  const refreshToken = await refreshTokenRepository.findByToken(token);

  if (!refreshToken) {
    throw new HttpError('Invalid refresh token', 401);
  }

  if (refreshToken.expiresAt < new Date()) {
    // Clean up expired token
    await refreshTokenRepository.deleteById(refreshToken.id);
    throw new HttpError('Refresh token expired', 401);
  }

  return refreshToken;
}