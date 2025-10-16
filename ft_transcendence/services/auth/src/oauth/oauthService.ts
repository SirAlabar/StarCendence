import { HttpError } from "../utils/HttpError"
import { getGoogleClientId, getGoogleClientSecret } from "../utils/getSecrets"

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