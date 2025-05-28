import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { AppError } from './errorHandler.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new AppError('No access token provided', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401));
    }
    next(new AppError('Invalid access token', 401));
  }
};
