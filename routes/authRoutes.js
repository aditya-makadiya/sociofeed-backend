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
  registerValidations,
  loginValidations,
  forgotPasswordValidations,
  resetPasswordValidations,
} from '../middleware/validate.js';

const router = express.Router();

// Register a new user
router.post('/register', registerValidations, register);

// Log in a user
router.post('/login', loginValidations, login);

// Activate user account
router.get('/activate/:token', activate);

// Request password reset
router.post('/forgot-password', forgotPasswordValidations, forgotPassword);

// Reset password
router.post('/reset-password/:token', resetPasswordValidations, resetPassword);

// Resend activation email
router.post('/resend-activation', forgotPasswordValidations, resendActivation);

// Refresh access token
router.get('/refresh-token', refreshToken);

// Log out a user
router.post('/logout', logout);

export default router;
