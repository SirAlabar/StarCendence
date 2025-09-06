// Core authentication logic
import * as bcrypt from 'bcrypt';
import * as userServiceClient from '../clients/userServiceClient';
import { HttpError } from '../utils/HttpError';
import * as tokenService from './tokenService';
import * as userRepository from '../repositories/userRepository';

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
  // TODO: verify is user is already signed in
  // TODO: verify 2FA if enabled
export async function loginUser(email: string, password: string) {

  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    throw new HttpError('Invalid email or password', 401);
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new HttpError('Invalid email or password', 401);
  }

  const tokens = await tokenService.generateTokens(user.id, user.email, user.username);

  return tokens;
}

// Logout user by revoking the refresh token
export async function logoutUser(refreshToken: string) {
  if (!refreshToken) {
    throw new HttpError('Refresh token is required', 400);
  }
  await tokenService.revokeRefreshToken(refreshToken);
}
