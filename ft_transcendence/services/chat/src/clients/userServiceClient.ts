import { HttpError } from "../utils/HttpError";
import { getInternalApiKey } from "../utils/getSecrets";

// Get friends IDs from User Service
export async function getFriendsIds(authId: string) 
{
  const response = await fetch(`http://user-service:3004/internal/friends-list/${authId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getInternalApiKey()
    }
  });

  if (!response.ok) {
    console.error(`[UserServiceClient] ❌ User service responded with ${response.status}`);
    throw new HttpError(`User service responded with ${response.status}`, response.status);
  }

  const friendIds = await response.json();

  return friendIds;
}