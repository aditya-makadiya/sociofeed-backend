import express from 'express';
import {
  getFeed,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  updateComment,
  deleteComment,
  savePost,
  unsavePost,
  getSavedPosts,
} from '../controllers/postController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadPostImages } from '../middleware/multer.js';
import {
  createPostValidations,
  updatePostValidations,
  commentValidations,
  postIdValidations,
  commentIdValidations,
} from '../middleware/validate.js';

const router = express.Router();

router.get('/feed', authMiddleware, getFeed); // Get home feed
router.post(
  '/',
  authMiddleware,
  uploadPostImages,
  createPostValidations,
  createPost
); // Create post
router.get('/:postId', authMiddleware, postIdValidations, getPostById); // Get post details
router.put(
  '/:postId',
  authMiddleware,
  postIdValidations,
  updatePostValidations,
  updatePost
); // Update post
router.delete('/:postId', authMiddleware, postIdValidations, deletePost); // Delete post
router.post('/:postId/like', authMiddleware, postIdValidations, likePost); // Like post
router.delete('/:postId/unlike', authMiddleware, postIdValidations, unlikePost); // Unlike post
router.post(
  '/:postId/comments',
  authMiddleware,
  postIdValidations,
  commentValidations,
  addComment
); // Add comment
router.put(
  '/comments/:commentId',
  authMiddleware,
  commentIdValidations,
  commentValidations,
  updateComment
); // Update comment
router.delete(
  '/comments/:commentId',
  authMiddleware,
  commentIdValidations,
  deleteComment
); // Delete comment
router.post('/:postId/save', authMiddleware, postIdValidations, savePost); // Save post
router.delete('/:postId/unsave', authMiddleware, postIdValidations, unsavePost); // Unsave post
router.get('/saved', authMiddleware, getSavedPosts); // Get saved posts

export default router;
