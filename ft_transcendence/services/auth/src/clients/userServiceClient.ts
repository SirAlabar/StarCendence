// Client for User Service communication
import { HttpError } from '../utils/HttpError';
import { getInternalApiKey } from '../utils/getSecrets';

// Create user in User Service
export async function createUserProfile(authId: string, email: string, username: string, oauthEnabled: boolean) {
  const response = await fetch('http://user-service:3004/internal/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    },
    body: JSON.stringify({
      authId,
      email,
      username,
      oauthEnabled
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
    method: 'PATCH',
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

// Update 2FA enabled/disabled in User Service
export async function updateTwoFactorState(authId: string, state: boolean) {
  const response = await fetch('http://user-service:3004/internal/update-2fa-state', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    },
    body: JSON.stringify({
      userId: authId,
      twoFactorEnabled: state
    })
  });

  if (!response.ok) {
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  return await response.json();
}
