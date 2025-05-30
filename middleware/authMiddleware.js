import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { AppError } from './errorHandler.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      req.userId = null;
      return next();
    }
    // console.log("Token", token);

    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log("decoded", decoded);

    req.user = { userId: decoded.userId, username: decoded.username };
    // console.log("req.user", req.user);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401));
    }
    // console.log(error);

    next(new AppError('Invalid access token', 401));
  }
};
