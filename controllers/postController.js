import {
  createPostService,
  getFeedService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  likePostService,
  unlikePostService,
  addCommentService,
  updateCommentService,
  deleteCommentService,
  savePostService,
  unsavePostService,
  getSavedPostsService,
} from '../services/postService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getFeed = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    if (!req.user) throw new AppError('Authentication required', 401);
    const result = await getFeedService({
      userId: req.user.userId,
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

export const createPost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const post = await createPostService(req.user.userId, req.body, req.files);
    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const post = await getPostByIdService(req.params.postId, req.user?.userId);
    if (!post) throw new AppError('Post not found', 404);
    res.status(200).json({
      status: 'success',
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const post = await updatePostService(
      req.params.postId,
      req.user.userId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: 'Post updated successfully',
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    await deletePostService(req.params.postId, req.user.userId);
    res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const likesCount = await likePostService(
      req.params.postId,
      req.user.userId
    );
    res.status(200).json({
      status: 'success',
      message: 'Post liked successfully',
      data: { likesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const likesCount = await unlikePostService(
      req.params.postId,
      req.user.userId
    );
    res.status(200).json({
      status: 'success',
      message: 'Post unliked successfully',
      data: { likesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const comment = await addCommentService(
      req.params.postId,
      req.user.userId,
      req.body
    );
    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const comment = await updateCommentService(
      req.params.commentId,
      req.user.userId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: 'Comment updated successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    await deleteCommentService(req.params.commentId, req.user.userId);
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const savePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    await savePostService(req.params.postId, req.user.userId);
    res.status(200).json({
      status: 'success',
      message: 'Post saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const unsavePost = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    await unsavePostService(req.params.postId, req.user.userId);
    res.status(200).json({
      status: 'success',
      message179: 'Post unsaved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const result = await getSavedPostsService({
      userId: req.user.userId,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
