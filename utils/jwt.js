import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  ACTIVATION_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from '../config/constants.js';

/**
 * Generates an access token for API authentication.
 * @param {Object} payload - Payload containing userId and username.
 * @returns {string} Signed JWT access token.
 */
export const generateAccessToken = payload => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: Math.floor(JWT_ACCESS_EXPIRES_IN / 1000),
  });
};

/**
 * Generates an activation token for account activation.
 * @param {string} userId - User ID.
 * @param {string} tokenId - Token ID.
 * @returns {string} Signed JWT activation token.
 */
export const generateActivationToken = (userId, tokenId) => {
  return jwt.sign({ userId, tokenId }, JWT_SECRET, {
    expiresIn: Math.floor(ACTIVATION_TOKEN_EXPIRES_IN / 1000),
  });
};

export const generateResetToken = (userId, tokenId) => {
  return jwt.sign({ userId, tokenId }, JWT_SECRET, {
    expiresIn: Math.floor(RESET_TOKEN_EXPIRES_IN / 1000),
  });
};

/**
 * Generates a refresh token for obtaining new access tokens.
 * @param {string} userId - User ID.
 * @param {string} tokenId - Token ID.
 * @returns {string} Signed JWT refresh token.
 */
export const generateRefreshToken = (userId, tokenId) => {
  return jwt.sign({ userId, tokenId }, JWT_SECRET, {
    expiresIn: Math.floor(JWT_REFRESH_EXPIRES_IN),
  });
};
