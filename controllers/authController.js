import { AppError } from '../middleware/errorHandler.js';
import {
  registerUser,
  loginUser,
  activateAccountUser,
  forgotPasswordUser,
  resetPasswordUser,
  resendActivationUser,
  refreshTokenUser,
  logoutUser,
} from '../services/authService.js';
import {
  COOKIE_ACCESS_MAX_AGE,
  COOKIE_REFRESH_MAX_AGE,
  COOKIE_SECURE,
} from '../config/constants.js';

/**
 * Registers a new user and sends an activation email.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
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

/**
 * Logs in a user and sets access and refresh token cookies.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_ACCESS_MAX_AGE,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_REFRESH_MAX_AGE,
      })
      .status(200)
      .json({
        status: 'success',
        message: 'Login successful',
        data: { user },
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
    await forgotPasswordUser(req.body.identifier);
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
    await resendActivationUser(req.body.identifier);
    res.status(200).json({
      status: 'success',
      message: 'Activation email resent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken;
    if (!refreshTokenValue) {
      throw new AppError('No refresh token provided', 401);
    }

    const { accessToken, user } = await refreshTokenUser(refreshTokenValue);
    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_ACCESS_MAX_AGE,
      })
      .status(200)
      .json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: { user },
      });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken;
    if (refreshTokenValue) {
      await logoutUser(refreshTokenValue);
    }
    res
      .clearCookie('accessToken', {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
      })
      .clearCookie('refreshToken', {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
      })
      .status(200)
      .json({
        status: 'success',
        message: 'Logged out successfully',
      });
  } catch (error) {
    next(error);
  }
};
