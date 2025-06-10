// routes/chatRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getConversations,
  getMessagesWithUser,
  sendMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/messages/:userId', authMiddleware, getMessagesWithUser);
router.post('/message/:userId', authMiddleware, sendMessage);

export default router;
