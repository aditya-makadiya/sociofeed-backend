import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { AppError } from './errorHandler.js';

export const authMiddlewareSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new AppError('Authentication required', 401);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId; // Attach userId to socket
    socket.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (error) {
    console.log(error);

    next(new AppError('Invalid or expired token', 401));
  }
};
