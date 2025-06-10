// controllers/chatController.js
import {
  getConversationsService,
  getMessagesWithUserService,
  sendMessageService,
} from '../services/chatService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getConversations = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversations = await getConversationsService(req.user.userId);
    res.status(200).json({
      status: 'success',
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessagesWithUser = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { userId } = req.params;
    const messages = await getMessagesWithUserService(req.user.userId, userId);
    res.status(200).json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { userId } = req.params;
    const { content } = req.body;
    console.log(req.user.userId);
    console.log(userId);

    const message = await sendMessageService(req.user.userId, userId, content);
    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
