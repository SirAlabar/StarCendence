// Session management service
import * as tokenService from './tokenService';
import * as refreshTokenRepository from '../repositories/refreshTokenRepository';

// Refresh access token using a valid refresh token
export async function refreshAccessToken(refreshToken: string) {
  // 1. Verify refresh token exists and is valid
  const refreshTokenRecord = await tokenService.verifyRefreshToken(refreshToken);
  
  // 2. Generate new tokens (with rotation - old refresh token is deleted)
  await refreshTokenRepository.deleteByToken(refreshToken);
  
  const newTokens = await tokenService.generateTokens(
    refreshTokenRecord.user.id,
    refreshTokenRecord.user.email,
    refreshTokenRecord.user.username
  );

  return newTokens;
}

// Revoke the specific refresh token (logout from this device/session)
export async function logoutUser(refreshToken: string) {
  await refreshTokenRepository.deleteByToken(refreshToken);
}

// Revoke all refresh tokens for user (logout from all devices)
export async function logoutAllDevices(userId: string) {
  await refreshTokenRepository.deleteAllByUserId(userId);
}

export async function revokeRefreshToken(token: string) {
  await refreshTokenRepository.deleteByToken(token);
}

export async function revokeAllUserTokens(userId: string) {
  await refreshTokenRepository.deleteAllByUserId(userId);
}

// Get all active refresh tokens for a user
export async function getUserSessions(userId: string) {
  const sessions = await refreshTokenRepository.findActiveByUserId(userId);

  return sessions;
}