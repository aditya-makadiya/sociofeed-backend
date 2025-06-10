// services/chatService.js
import { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

const isValidUUID = id => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const getConversationsService = async userId => {
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  try {
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group messages by conversation
    const groupedConversations = {};
    conversations.forEach(msg => {
      const otherUserId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!groupedConversations[otherUserId]) {
        groupedConversations[otherUserId] = {
          userId: otherUserId,
          username:
            msg.senderId === userId
              ? msg.receiver.username
              : msg.sender.username,
          avatar:
            msg.senderId === userId ? msg.receiver.avatar : msg.sender.avatar,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0, // You can implement logic to count unread messages if needed
        };
      } else {
        // Update last message and time for existing conversation
        groupedConversations[otherUserId].lastMessage = msg.content;
        groupedConversations[otherUserId].lastMessageTime = msg.createdAt;
      }
    });

    return Object.values(groupedConversations);
  } catch (error) {
    throw new AppError(`Failed to fetch conversations: ${error.message}`, 500);
  }
};

export const getMessagesWithUserService = async (userId, otherUserId) => {
  if (!isValidUUID(userId) || !isValidUUID(otherUserId)) {
    throw new AppError('Invalid user ID format', 400);
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  } catch (error) {
    throw new AppError(`Failed to fetch messages: ${error.message}`, 500);
  }
};

export const sendMessageService = async (senderId, receiverId, content) => {
  if (!isValidUUID(senderId) || !isValidUUID(receiverId)) {
    throw new AppError('Invalid user ID format', 400);
  }

  if (!content) {
    throw new AppError('Message content cannot be empty', 400);
  }

  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return message;
  } catch (error) {
    throw new AppError(`Failed to send message: ${error.message}`, 500);
  }
};
