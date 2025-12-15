import { PrismaClient } from '@prisma/client';
import { getRoomId } from './chatService';

const prisma = new PrismaClient();

// ✅ EXISTING FUNCTIONS
export async function getConversationByRoomId(roomId: string) 
{
  return prisma.chatConversation.findFirst({
    where: { roomId },
    include: {
      messages: true,
    },
  });
}

export async function createConversation(userId: string, targetUserId: string) 
{
  const roomId = await getRoomId(userId, targetUserId);
  return prisma.chatConversation.create({
    data: {
      roomId,
      userAId: userId,
      userBId: targetUserId,
    },
  });
}

// Get all messages for a conversation
export async function getMessagesByRoomId(roomId: string) 
{
  const conversation = await prisma.chatConversation.findFirst({
    where: { roomId },
    include: {
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return conversation?.messages || [];
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, senderId: string) 
{
  await prisma.message.updateMany({
    where: {
      conversationId: conversationId,
      senderId: senderId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

// Get unread counts for a user
export async function getUnreadCountsByUserId(userId: string) 
{
  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
    include: {
      messages: {
        where: {
          senderId: {
            not: userId,
          },
          isRead: false,
        },
      },
    },
  });

  // Build result array
  const unreadCounts: { friendId: string; count: number }[] = [];

  for (const conversation of conversations) 
  {
    const friendId = conversation.userAId === userId 
      ? conversation.userBId 
      : conversation.userAId;

    const count = conversation.messages.length;

    if (count > 0) 
    {
      unreadCounts.push({ friendId, count });
    }
  }

  return unreadCounts;
}

// Save message directly (for HTTP fallback)
export async function saveMessageDirect(conversationId: string, senderId: string, content: string) 
{
  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
}