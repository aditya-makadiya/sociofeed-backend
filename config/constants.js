export const USERNAME_REGEX = /^[a-zA-Z0-9]{3,50}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const JWT_EXPIRES_IN = '7d';
export const ACTIVATION_TOKEN_EXPIRES_IN = 60 * 60 * 1000;
export const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000;
export const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
