import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveMessage(fromUserId: string, roomId: string, message: string) 
{
  const conversation = await prisma.chatConversation.findFirst({
    where: { roomId },
  });

  if (!conversation) 
  {
    throw new Error('Conversation not found');
  }

  // Return the created message
  return await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: fromUserId,
      content: message,
      isRead: false,
    },
  });
}