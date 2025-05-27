import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ACTIVATION_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_IN,
} from '../config/constants.js';

export const generateToken = payload => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateActivationToken = (userId, tokenId) => {
  return jwt.sign({ userId, tokenId }, JWT_SECRET, {
    expiresIn: ACTIVATION_TOKEN_EXPIRES_IN,
  });
};

export const generateResetToken = (userId, tokenId) => {
  return jwt.sign({ userId, tokenId }, JWT_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES_IN,
  });
};
