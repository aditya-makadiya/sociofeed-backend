import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  generateAccessToken,
  generateActivationToken,
  generateResetToken,
  generateRefreshToken,
} from '../utils/jwt.js';
import { sendActivationEmail, sendResetPasswordEmail } from './emailService.js';
import {
  JWT_SECRET,
  ACTIVATION_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from '../config/constants.js';

const prisma = new PrismaClient();

const storeToken = async (
  token,
  type,
  userId,
  expiresAt,
  id = crypto.randomUUID()
) => {
  if (!userId) {
    throw new AppError('Invalid user ID for token creation', 400);
  }
  try {
    return await prisma.token.create({
      data: {
        id,
        token,
        type,
        expiresAt,
        userId,
      },
    });
  } catch (error) {
    throw new AppError(`Failed to create token: ${error.message}`, 500);
  }
};

export const registerUser = async ({ username, email, password }) => {
  if (!username || !email) {
    throw new AppError('Username and email are required', 400);
  }
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('Email already exists', 400);
    }
    if (existingUser.username === username) {
      throw new AppError('Username already exists', 400);
    }
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isActive: false,
      },
    });

    console.log('New user created with ID:', newUser.id); // Debug

    const tokenId = crypto.randomUUID();
    const token = generateActivationToken(newUser.id, tokenId);
    const tokenData = await storeToken(
      token,
      'activation',
      newUser.id,
      new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN),
      tokenId
    );

    await sendActivationEmail(newUser, tokenData.token);
    return { id: newUser.id, username: newUser.username, email: newUser.email };
  } catch (error) {
    console.error('Registration error:', error); // Debug
    throw new AppError(`Failed to register user: ${error.message}`, 500);
  }
};

export const loginUser = async ({ identifier, password }) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    throw new AppError('Invalid username or email', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account not activated. Please check your email.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid password', 401);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
  });
  const tokenId = crypto.randomUUID();
  const refreshToken = generateRefreshToken(user.id, tokenId);

  await storeToken(
    refreshToken,
    'refresh',
    user.id,
    new Date(Date.now() + JWT_REFRESH_EXPIRES_IN),
    tokenId
  );

  return {
    user: { id: user.id, username: user.username, email: user.email },
    accessToken,
    refreshToken,
  };
};

// src/services/authService.js
export const getCurrentUser = async accessToken => {
  if (!accessToken) {
    throw new AppError('No access token provided', 401);
  }

  try {
    const { userId } = jwt.verify(accessToken, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    return user;
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      throw new AppError('Invalid or expired access token', 401);
    }
    throw new AppError(`Failed to fetch user: ${error.message}`, 500);
  }
};

export const activateAccountUser = async token => {
  const tokenRecord = await prisma.token.findFirst({
    where: { token, type: 'activation' },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AppError('Invalid or expired activation token', 400);
  }

  if (tokenRecord.user.isActive) {
    throw new AppError('Account already activated', 400);
  }

  try {
    const { userId, tokenId } = jwt.verify(token, JWT_SECRET);
    if (tokenRecord.id !== tokenId) {
      throw new AppError('Invalid token', 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    return {
      id: userId,
      username: tokenRecord.user.username,
      email: tokenRecord.user.email,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Activation token expired', 400);
    }
    throw error;
  }
};

export const forgotPasswordUser = async identifier => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    throw new AppError('No account found with this username or email', 404);
  }

  if (!user.isActive) {
    throw new AppError(
      'Account is inactive. Please activate your account first.',
      403
    );
  }

  const tokenId = crypto.randomUUID();
  const token = generateResetToken(user.id, tokenId);
  await storeToken(
    token,
    'reset',
    user.id,
    new Date(Date.now() + RESET_TOKEN_EXPIRES_IN),
    tokenId
  );

  await sendResetPasswordEmail(user, token);
};

export const resetPasswordUser = async (token, { password }) => {
  const tokenRecord = await prisma.token.findFirst({
    where: { token, type: 'reset', used: false },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  try {
    const { userId, tokenId } = jwt.verify(token, JWT_SECRET);
    if (tokenRecord.id !== tokenId) {
      throw new AppError('Invalid token', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Reset token expired', 400);
    }
    throw error;
  }
};

/**
 * Resends an activation email for an inactive account.
 * @param {string} email - User email.
 * @returns {Promise<void>}
 * @throws {AppError} If user not found or already activated.
 */
export const resendActivationUser = async identifier => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    throw new AppError('No account found with this username or email', 404);
  }

  const tokenId = crypto.randomUUID();
  const token = generateActivationToken(user.id, tokenId);
  await storeToken(
    token,
    'activation',
    user.id,
    new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN),
    tokenId
  );

  await sendActivationEmail(user, token);
};

export const refreshTokenUser = async refreshToken => {
  const tokenRecord = await prisma.token.findFirst({
    where: { token: refreshToken, type: 'refresh' },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  try {
    const { userId, tokenId } = jwt.verify(refreshToken, JWT_SECRET);
    if (tokenRecord.id !== tokenId) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      username: tokenRecord.user.username,
    });
    console.log(userId);

    return {
      accessToken,
      user: {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        email: tokenRecord.user.email,
      },
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      await prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });
      throw new AppError('Refresh token expired', 401);
    }
    throw error;
  }
};

/**
 * Logs out a user by invalidating the refresh token.
 * @param {string} refreshToken - Refresh token.
 * @returns {Promise<void>}
 * @throws {AppError} If refresh token is invalid.
 */
export const logoutUser = async refreshToken => {
  const tokenRecord = await prisma.token.findFirst({
    where: { token: refreshToken, type: 'refresh', used: false },
  });

  if (!tokenRecord) {
    throw new AppError('Invalid refresh token', 401);
  }

  await prisma.token.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });
};
