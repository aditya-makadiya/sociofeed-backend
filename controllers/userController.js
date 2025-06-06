import {
  getUsersService,
  getUserByIdService,
  updateProfileService,
  updateAvatarService,
  followUserService,
  unfollowUserService,
  getFollowersService,
  getFollowingService,
  getUserPostsService,
  getUserSuggestionsService,
  resetAvatarService,
} from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getUsers = async (req, res, next) => {
  try {
    console.log(req.query);
    const { search: q = '', page = 1, pageSize = 10 } = req.query;
    const result = await getUsersService({
      query: q,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      currentUserId: req.user?.userId,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id, req.user?.userId);
    if (!user) {
      throw new AppError('User not found or inactive', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const resetAvatar = async (req, res, next) => {
  try {
    if (!req.user || req.params.id !== req.user.userId) {
      throw new AppError('Unauthorized to reset this avatar', 403);
    }
    const user = await resetAvatarService(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Avatar reset to default successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user || req.params.id !== req.user.userId) {
      throw new AppError('Unauthorized to update this profile', 403);
    }
    const user = await updateProfileService(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.user || req.params.id !== req.user.userId) {
      throw new AppError('Unauthorized to update this avatar', 403);
    }
    const user = await updateAvatarService(req.params.id, req.file);
    res.status(200).json({
      status: 'success',
      message: 'Avatar updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    if (req.params.id === req.user.userId) {
      throw new AppError('Cannot follow yourself', 400);
    }
    await followUserService(req.user.userId, req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'User followed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    await unfollowUserService(req.user.userId, req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'User unfollowed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const {
      q = '',
      page = 1,
      pageSize = 10,
      includeInactive = 'false',
    } = req.query;
    const result = await getFollowersService({
      userId: req.params.id,
      query: q,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      currentUserId: req.user?.userId,
      includeInactive: includeInactive === 'true', // Pass includeInactive flag
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { q = '', page = 1, pageSize = 10 } = req.query;
    const result = await getFollowingService({
      userId: req.params.id,
      query: q,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      currentUserId: req.user?.userId,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await getUserPostsService({
      userId: req.params.id,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      currentUserId: req.user?.userId,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSuggestions = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const { page = 1, pageSize = 10 } = req.query;
    const result = await getUserSuggestionsService({
      currentUserId: req.user.userId,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
