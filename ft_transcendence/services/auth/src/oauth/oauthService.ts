import { HttpError } from "../utils/HttpError"
import { getGoogleClientId, getGoogleClientSecret } from "../utils/getSecrets"
// import * as userRepository from "../user/userRepository"

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

// export async function findOrCreateUser(userInfo: any) {

// }