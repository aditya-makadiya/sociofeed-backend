import express from 'express';
import {
  register,
  login,
  activate,
  forgotPassword,
  resetPassword,
  resendActivation,
} from '../controllers/authController.js';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/activate/:token', activate);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  resetPassword
);
router.post(
  '/resend-activation',
  validate(forgotPasswordSchema),
  resendActivation
);

export default router;
