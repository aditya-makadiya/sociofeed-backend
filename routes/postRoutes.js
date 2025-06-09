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
  getPostComments, // Added new controller
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

router.get('/feed', authMiddleware, getFeed);
router.get('/saved', authMiddleware, getSavedPosts);
router.post(
  '/',
  authMiddleware,
  uploadPostImages,
  createPostValidations,
  createPost
);
router.get('/:postId', authMiddleware, postIdValidations, getPostById);
router.put(
  '/:postId',
  authMiddleware,
  postIdValidations,
  updatePostValidations,
  updatePost
);
router.delete('/:postId', authMiddleware, postIdValidations, deletePost);
router.post('/:postId/like', authMiddleware, postIdValidations, likePost);
router.delete('/:postId/unlike', authMiddleware, postIdValidations, unlikePost);
router.post(
  '/:postId/comments',
  authMiddleware,
  postIdValidations,
  commentValidations,
  addComment
);
router.get(
  '/:postId/comments',
  authMiddleware,
  postIdValidations,
  getPostComments
); // Added new route
router.put(
  '/comments/:commentId',
  authMiddleware,
  commentIdValidations,
  commentValidations,
  updateComment
);
router.delete(
  '/comments/:commentId',
  authMiddleware,
  commentIdValidations,
  deleteComment
);
router.post('/:postId/save', authMiddleware, postIdValidations, savePost);
router.delete('/:postId/unsave', authMiddleware, postIdValidations, unsavePost);

export default router;
