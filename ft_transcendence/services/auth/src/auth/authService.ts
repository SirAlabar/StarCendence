// Core authentication logic
import * as bcrypt from 'bcrypt';
import * as userServiceClient from '../clients/userServiceClient';
import { HttpError } from '../utils/HttpError';
import * as tokenService from '../token/tokenService';
import * as userRepository from './userRepository';
import * as refreshTokenRepository from '../token/refreshTokenRepository';
import { TokenPair, TokenType } from '../token/token.types';

// Register a new user
export async function registerUser(email: string, password: string, username: string) {
  const existingUser = await userRepository.findUserByEmailOrUsername(email, username);
  if (existingUser) {
    throw new HttpError('Email or username already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const authUser = await userRepository.createUser(email, hashedPassword, username);

  await userServiceClient.createUserProfile(authUser.id, email, username);
}

// Login user and return tokens
export async function loginUser(email: string, password: string) {
  const user = await userRepository.findUserByEmail(email);
  if (!user || !user.password) {
    throw new HttpError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new HttpError('Invalid email or password', 401);
  }

  if (user.twoFactorEnabled) {
    const tempToken = await tokenService.generateTempToken(user.id);
    return { tempToken, type: TokenType.TEMP };
  }

  const existingTokens = await refreshTokenRepository.findByUserId(user.id);
  if (existingTokens) {
    await refreshTokenRepository.deleteByUserId(user.id);
  }

  const tokens = await tokenService.generateTokens(user.id, user.email, user.username);

  return tokens;
}

// Logout user by revoking all refresh tokens using the access token
export async function logoutUser(accessToken: string) {
  const payload = await tokenService.verifyAccessToken(accessToken);
  if (!payload || !payload.sub) {
    throw new HttpError('Invalid access token', 401);
  }

  await tokenService.revokeAllRefreshTokensForUser(payload.sub);
}

// Verify 2FA code and return JWTs
export async function verifyTwoFA(tempToken: string, twoFACode: string) {
  const payload = await tokenService.verifyAccessToken(tempToken);
  if (!payload || !payload.sub) {
    throw new HttpError('Invalid temporary token', 401);
  }
  
  const user = await userRepository.findUserById(payload.sub);
  if (!user || !user.twoFactorSecret) {
    throw new HttpError('User not found or 2FA not set up', 404);
  }
  
  const isCodeValid = await tokenService.verifyTwoFACode(user.twoFactorSecret, twoFACode);
  if (!isCodeValid) {
    throw new HttpError('Invalid 2FA code', 401);
  }
  
  const existingTokens = await refreshTokenRepository.findByUserId(user.id);
  if (existingTokens) {
    await refreshTokenRepository.deleteByUserId(user.id);
  }

  const tokens = await tokenService.generateTokens(user.id, user.email, user.username);

  return tokens;
}

// Update user password
export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new HttpError('Current password is incorrect', 401);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updateUserPassword(userId, hashedNewPassword);
}