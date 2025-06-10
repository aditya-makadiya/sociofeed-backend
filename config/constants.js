export const USERNAME_REGEX = /^[a-zA-Z0-9]{3,50}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const JWT_ACCESS_EXPIRES_IN = 120 * 60 * 1000;
export const JWT_REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000;
export const ACTIVATION_TOKEN_EXPIRES_IN = 60 * 60 * 1000;
export const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000;
export const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
export const COOKIE_ACCESS_MAX_AGE = 15 * 60 * 1000;
export const COOKIE_REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const COOKIE_SECURE = process.env.NODE_ENV === 'production';
