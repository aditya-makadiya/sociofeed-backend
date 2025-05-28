import express from 'express';
import {
  register,
  login,
  activate,
  forgotPassword,
  resetPassword,
  resendActivation,
  refreshToken,
  logout,
} from '../controllers/authController.js';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middleware/validate.js';

const router = express.Router();

// Register a new user
router.post('/register', validate(registerSchema), register);

// Log in a user
router.post('/login', validate(loginSchema), login);

// Activate user account
router.get('/activate/:token', activate);

// Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// Reset password
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  resetPassword
);

// Resend activation email
router.post(
  '/resend-activation',
  validate(forgotPasswordSchema),
  resendActivation
);

// Refresh access token
router.get('/refresh-token', refreshToken);

// Log out a user
router.post('/logout', logout);

export default router;
