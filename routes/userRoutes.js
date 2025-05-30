import express from 'express';
import {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserPosts,
  getUserSuggestions,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import {
  followValidations,
  updateProfileValidations,
} from '../middleware/validate.js';

const router = express.Router();

/**
 * User routes for profile and discovery.
 */
router.get('/suggestions', authMiddleware, getUserSuggestions); // Get suggested users
router.get('/', authMiddleware, getUsers); // List users with search
router.get('/:id', authMiddleware, getUserById); // Get user profile
router.patch('/:id', authMiddleware, updateProfileValidations, updateProfile); // Update bio
router.patch('/:id/avatar', authMiddleware, uploadAvatar, updateAvatar); // Update avatar
router.post('/:id/follow', authMiddleware, followValidations, followUser); // Follow user
router.delete('/:id/follow', authMiddleware, followValidations, unfollowUser); // Unfollow user
router.get('/:id/followers', authMiddleware, getFollowers); // List followers
router.get('/:id/following', authMiddleware, getFollowing); // List following
router.get('/:id/posts', authMiddleware, getUserPosts); // Get user posts

export default router;
