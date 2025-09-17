import { readFileSync} from 'fs';
import { HttpError } from '../utils/error';

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