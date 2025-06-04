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
  getCurrentUser,
} from '../services/authService.js';
import {
  COOKIE_ACCESS_MAX_AGE,
  COOKIE_REFRESH_MAX_AGE,
  COOKIE_SECURE,
} from '../config/constants.js';

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
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    res
      .cookie('accessToken', accessToken, {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_ACCESS_MAX_AGE,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_REFRESH_MAX_AGE,
      })
      .cookie('isAuthenticated', 'true', {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: COOKIE_REFRESH_MAX_AGE,
      })
      .cookie('user', JSON.stringify(user), {
        httpOnly: false,
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
    if (user.alreadyActivated) {
      return res.status(200).json({
        status: 'success',
        message: 'Account already activated',
        data: { user },
      });
    }
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

// src/controllers/authController.js
export const getMe = async (req, res, next) => {
  try {
    if (!req.cookies.isAuthenticated) {
      throw new AppError('Not authenticated', 401);
    }
    const accessToken = req.cookies.accessToken;
    const refreshToken1 = req.cookies.refreshToken;
    // const refreshToken1 = req.cookie.refreshToken;
    console.log('getMe cookies:', req.cookies.refreshToken);
    // console.log('getMe user:', req.user);
    const user = await getCurrentUser(accessToken);
    res.status(200).json({
      status: 'success',
      data: { user },
      accessToken: accessToken,
      refreshToken: refreshToken1,
    });
  } catch (error) {
    console.error('getMe error:', error);
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
      await logoutUser(refreshTokenValue); // Revoke or delete refresh token from DB if needed
    }

    res
      .clearCookie('accessToken', {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
      })
      .clearCookie('refreshToken', {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
      })
      .clearCookie('isAuthenticated', {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'lax',
      })
      .clearCookie('user', {
        httpOnly: false,
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
