import { Server } from 'socket.io';
import { PrismaClient } from '../generated/prisma/client.js';
// import { AppError } from '../middleware/errorHandler.js';
import { authMiddlewareSocket } from '../middleware/authMiddlewareSocket.js';

const prisma = new PrismaClient();
const onlineUsers = new Map();

export const initSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.BASE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(authMiddlewareSocket);

  io.on('connection', socket => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    socket.on('send_message', async ({ content, receiverId }) => {
      if (!content || !receiverId) {
        return socket.emit('error_message', 'Missing content or receiverId');
      }
      try {
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
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

        // Emit to sender
        socket.emit('receive_message', message);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', message);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error_message', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};
