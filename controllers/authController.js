import {
  registerUser,
  loginUser,
  activateAccountUser,
  forgotPasswordUser,
  resetPasswordUser,
  resendActivationUser,
} from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { username, email } = await registerUser(req.body);
    res.status(201).json({
      status: 'success',
      message:
        'Registration successful. Please check your email to activate your account.',
      data: { user: { username, email } },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

export const activate = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await activateAccountUser(token);
    res.status(200).json({
      status: 'success',
      message: 'Account activated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await forgotPasswordUser(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    await resetPasswordUser(token, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const resendActivation = async (req, res, next) => {
  try {
    await resendActivationUser(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'Activation email resent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};
