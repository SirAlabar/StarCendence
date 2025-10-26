import { readFileSync } from 'fs';
import { HttpError } from './HttpError';

// Get internal API key from Docker secret
export function getInternalApiKey(): string {
	const apiKey: string = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
	if (!apiKey) {
		throw new HttpError('Internal API key is not configured', 500);
	}
  return apiKey;
}

// Get JWT secret from Docker secret file
export function getJwtSecret(): string {
	const jwtSecret: string = readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
	if (!jwtSecret) {
		throw new HttpError('JWT secret is not configured', 500);
	}
  return jwtSecret;
}

// Get Google OAuth2 credentials from Docker secrets
export function getGoogleClientId(): string {
  const clientId: string = readFileSync('/run/secrets/google_client_id', 'utf8').trim();
  if (!clientId) {
    throw new HttpError('Google Client ID is not configured', 500);
  }
  return clientId;
}

// Get Google OAuth2 client secret from Docker secret
export function getGoogleClientSecret(): string {
  const clientSecret: string = readFileSync('/run/secrets/google_client_secret', 'utf8').trim();
  if (!clientSecret) {
    throw new HttpError('Google Client Secret is not configured', 500);
  }
  return clientSecret;
}