import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  generateToken,
  generateActivationToken,
  generateResetToken,
} from '../utils/jwt.js';
import { sendActivationEmail, sendResetPasswordEmail } from './emailService.js';
import {
  JWT_SECRET,
  ACTIVATION_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_IN,
} from '../config/constants.js';

const prisma = new PrismaClient();

export const registerUser = async ({ username, email, password }) => {
  if (!username || !email) {
    throw new AppError('Username and email are required', 400);
  }
  // Check for existing user
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

  // Create user and token in a transaction
  try {
    const [user, tokenRecord] = await prisma.$transaction(async tx => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          isActive: false,
        },
      });

      const tokenId = crypto.randomUUID();
      const token = generateActivationToken(newUser.id, tokenId);
      const tokenData = await tx.token.create({
        data: {
          token,
          type: 'activation',
          expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN),
          userId: newUser.id,
        },
      });

      return [newUser, tokenData];
    });

    await sendActivationEmail(user, tokenRecord.token);
    return { id: user.id, username: user.username, email: user.email };
  } catch (error) {
    throw new AppError('Failed to register user', error, 500);
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

  const token = generateToken({ userId: user.id, username: user.username });
  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
};

export const activateAccountUser = async token => {
  const tokenRecord = await prisma.token.findFirst({
    where: { token, type: 'activation', used: false },
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
  await prisma.token.create({
    data: {
      token,
      type: 'reset',
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN),
      userId: user.id,
    },
  });

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

export const resendActivationUser = async email => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }

  if (user.isActive) {
    throw new AppError('Account already activated', 400);
  }

  const tokenId = crypto.randomUUID();
  const token = generateActivationToken(user.id, tokenId);
  await prisma.token.create({
    data: {
      token,
      type: 'activation',
      expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN),
      userId: user.id,
    },
  });

  await sendActivationEmail(user, token);
};
