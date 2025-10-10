// Client for User Service communication
import { readFileSync } from 'fs';
import { HttpError } from '../utils/HttpError';

// Get internal API key from Docker secret
export function getInternalApiKey(): string {
	const apiKey: string = readFileSync('/run/secrets/internal_api_key', 'utf8').trim();
	if (!apiKey) {
		throw new HttpError('Internal API key is not configured', 500);
	}
  return apiKey;
}

// Create user in User Service
export async function createUserProfile(authId: string, email: string, username: string) {
  const response = await fetch('http://user-service:3004/internal/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    },
    body: JSON.stringify({
      authId,
      email,
      username
    })
  });

  if (!response.ok) {
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  return await response.json();
}

// Get user profile from User Service
export async function getUserProfile(authId: string) {
  const response = await fetch(`http://user-service:3004/internal/users/${authId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    }
  });

  if (!response.ok) {
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  return await response.json();
}

// Update user status in User Service
export async function updateUserStatus(authId: string, status: string) {
  if (!authId || !status || authId === undefined || status === undefined) {
    throw new HttpError('Auth ID and status are required', 400);
  }

  const response = await fetch('http://user-service:3004/internal/update-user-status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    },
    body: JSON.stringify({
      userId: authId,
      status
    })
  });

  if (!response.ok) {
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  return await response.json();
}
