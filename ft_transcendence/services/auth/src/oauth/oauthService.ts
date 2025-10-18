import { HttpError } from "../utils/HttpError"
import { getGoogleClientId, getGoogleClientSecret } from "../utils/getSecrets"
import * as userRepository from "../auth/userRepository"
import * as oauthRepository from "./oauthRepository"
import * as tokenService from "../token/tokenService"
import * as refreshTokenRepository from "../token/refreshTokenRepository"
import * as userServiceClient from "../clients/userServiceClient"

// Function to exchange authorization code for tokens
export async function getGoogleTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    throw new HttpError('Failed to fetch tokens from Google', response.status)
  }

  return response.json()
}

// Function to get user info using access token
export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new HttpError('Failed to fetch user info from Google', response.status)
  }

  return response.json()
}

// Function to get ID token info
export async function getGoogleIdTokenInfo(idToken: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new HttpError('Failed to fetch ID token info from Google', response.status)
  }

  return response.json()
}

// Function to find or create user based on Google user info
export async function handleOauthLogin(userInfo: any) {
  const oauthId = userInfo.id;
  if (!userInfo.email || !oauthId) {
    throw new HttpError('Email and OAuth ID required', 400);
  }

  const userByOauthId = await oauthRepository.findUserByOauthId(oauthId);
  if (userByOauthId) {
    if (!userByOauthId.id || !userByOauthId.email || !userByOauthId.username) {
      throw new HttpError('Incomplete user data', 500);
    }
    const existingTokens = await refreshTokenRepository.findByUserId(userByOauthId.id);
    if (existingTokens) {
      await refreshTokenRepository.deleteByUserId(userByOauthId.id);
    }
    const tokens = await tokenService.generateTokens(userByOauthId.id, userByOauthId.email, userByOauthId.username);
    return { user: userByOauthId, tokens };
  }

  const userByEmail = await userRepository.findUserByEmail(userInfo.email);
  if (userByEmail) {
    if (!userByEmail.oauthId) {
      throw new HttpError('User with this email already exists. Please login using your credentials.', 400);
    }
    if (!userByEmail.id || !userByEmail.email || !userByEmail.username) {
      throw new HttpError('Incomplete user data', 500);
    }
    const existingTokens = await refreshTokenRepository.findByUserId(userByEmail.id);
    if (existingTokens) {
      await refreshTokenRepository.deleteByUserId(userByEmail.id);
    }
    const tokens = await tokenService.generateTokens(userByEmail.id, userByEmail.email, userByEmail.username);
    return { user: userByEmail, tokens };
  }

  const tempToken = await tokenService.generatePartialOAuthToken(oauthId, userInfo.email);
  return { tempToken, needsUsername: true };
}

// Function to create a new OAuth user
export async function createNewOauthUser(oauthId: string, email: string, username: string) {
  const existingUser = await userRepository.findUserByUsername(username);
  if (existingUser) {
    throw new HttpError('Username already taken', 400);
  }

  const newUser = await oauthRepository.createOauthUser(oauthId, email, username);
  await userServiceClient.createUserProfile(newUser.id, email, username);
  return newUser;
}
