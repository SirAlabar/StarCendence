import { HttpError } from "../utils/HttpError";
import { getInternalApiKey } from "../utils/getSecrets";

// Get friends IDs from User Service
export async function getFriendsIds(authId: string) {
  console.log(`Fetching friends for user: ${authId}`);
  const response = await fetch(`http://user-service:3004/internal/friends-list/${authId}`, {
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