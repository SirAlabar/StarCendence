import * as chatRepository from './chatRepository';
import { HttpError } from '../utils/HttpError';

// Create a new conversation between two users if it doesn't already exist
export async function createConversation(userId: string, targetUserId: string) {
  const roomId = await getRoomId(userId, targetUserId);

  const existingConversation = await chatRepository.getConversationByRoomId(roomId);
  if (existingConversation) {
    return existingConversation;
  }

  return chatRepository.createConversation(userId, targetUserId);
}

// Get the conversation between two users
export async function getConversationBetweenUsers(userId: string, targetUserId: string) {
  const roomId = await getRoomId(userId, targetUserId);

  const chatConversation = await chatRepository.getConversationByRoomId(roomId);
  if (!chatConversation) {
    throw new HttpError('Conversation not found', 404);
  }

  return chatConversation;
}

// Generate a unique room ID for a conversation between two users
export async function getRoomId(userId1: string, userId2: string) {
  return [userId1, userId2].sort().join('_');
}