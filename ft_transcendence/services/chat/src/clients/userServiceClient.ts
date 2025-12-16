import { HttpError } from "../utils/HttpError";
import { getInternalApiKey } from "../utils/getSecrets";

// Get friends IDs from User Service
export async function getFriendsIds(authId: string) {
  console.log(`[UserServiceClient] 🔍 Fetching friends for user: ${authId}`);
  
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
  
  // 🔍 DEBUG: See what we actually got
  console.log(`[UserServiceClient] 📦 Raw response:`, JSON.stringify(friendIds));
  console.log(`[UserServiceClient] 📊 Type:`, typeof friendIds);
  console.log(`[UserServiceClient] 📊 Is Array:`, Array.isArray(friendIds));
  console.log(`[UserServiceClient] 📊 Length:`, friendIds?.length || 0);
  
  return friendIds;
}