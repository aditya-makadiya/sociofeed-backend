import { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { cloudinaryInstance } from '../config/cloudinary.js';
import { Readable } from 'stream';

const prisma = new PrismaClient();

const isValidUUID = id => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const getFeedService = async ({ userId, page, pageSize }) => {
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);
  if (page < 1 || pageSize < 1 || pageSize > 50)
    throw new AppError('Invalid page or pageSize', 400);

  const skip = (page - 1) * pageSize;
  const followingIds = await prisma.follow
    .findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    .then(follows => follows.map(f => f.followingId));

  const where = {
    userId: { in: [...followingIds, userId] },
    user: { isActive: true },
  };

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          content: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
          likes: userId ? { where: { userId }, select: { id: true } } : false,
          savedBy: userId ? { where: { userId }, select: { id: true } } : false,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        images: post.images,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
        },
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: userId ? post.likes.length > 0 : false,
        isSaved: userId ? post.savedBy.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch feed: ${error.message}`, 500);
  }
};

export const createPostService = async (userId, { content }, files) => {
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);
  if (!content && (!files || files.length === 0))
    throw new AppError('Content or images required', 400);

  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
  });
  if (!user) throw new AppError('User not found or inactive', 404);

  let imageUrls = [];
  if (files && files.length > 0) {
    if (files.length > 4) throw new AppError('Maximum 4 images allowed', 400);
    for (const file of files) {
      const stream = Readable.from(file.buffer);
      const publicId = `${userId}_post_${Date.now()}`;
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinaryInstance.uploader.upload_stream(
          {
            folder: 'sociofeed/posts',
            public_id: publicId,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            invalidate: true,
            tags: ['post', `user_${userId}`],
            transformation: [
              { width: 800, height: 800, crop: 'limit', gravity: 'center' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error)
              reject(
                new AppError(`Cloudinary upload failed: ${error.message}`, 500)
              );
            resolve(result);
          }
        );
        stream.pipe(uploadStream);
      });
      imageUrls.push(uploadResult.secure_url);
    }
  }

  try {
    const post = await prisma.post.create({
      data: {
        content: content || '',
        images: imageUrls,
        userId,
      },
      select: {
        id: true,
        content: true,
        images: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return {
      id: post.id,
      content: post.content,
      images: post.images,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: false,
    };
  } catch (error) {
    throw new AppError(`Failed to create post: ${error.message}`, 500);
  }
};

export const getPostByIdService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (userId && !isValidUUID(userId))
    throw new AppError('Invalid user ID format', 400);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        images: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, username: true, avatar: true, isActive: true },
        },
        _count: { select: { likes: true, comments: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post || !post.user.isActive) return null;

    return {
      id: post.id,
      content: post.content,
      images: post.images,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: userId ? post.likes.length > 0 : false,
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          avatar: comment.user.avatar,
        },
      })),
    };
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw new AppError(`Failed to fetch post: ${error.message}`, 500);
  }
};

export const updatePostService = async (postId, userId, { content }) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (!post) throw new AppError('Post not found', 404);
  if (post.userId !== userId)
    throw new AppError('Unauthorized to update this post', 403);

  try {
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
      select: {
        id: true,
        content: true,
        images: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return {
      id: updatedPost.id,
      content: updatedPost.content,
      images: updatedPost.images,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      user: {
        id: updatedPost.user.id,
        username: updatedPost.user.username,
        avatar: updatedPost.user.avatar,
      },
      likeCount: updatedPost._count.likes,
      commentCount: updatedPost._count.comments,
      isLiked: false,
    };
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Post not found', 404);
    throw new AppError(`Failed to update post: ${error.message}`, 500);
  }
};

export const deletePostService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, images: true },
  });
  if (!post) throw new AppError('Post not found', 404);
  if (post.userId !== userId)
    throw new AppError('Unauthorized to delete this post', 403);

  if (post.images && post.images.length > 0) {
    for (const imageUrl of post.images) {
      const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
      try {
        await cloudinaryInstance.uploader.destroy(
          `sociofeed/posts/${publicId}`,
          { invalidate: true }
        );
      } catch (error) {
        console.error(
          `Failed to delete Cloudinary image ${publicId}:`,
          error.message
        );
      }
    }
  }

  try {
    await prisma.post.delete({ where: { id: postId } });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Post not found', 404);
    throw new AppError(`Failed to delete post: ${error.message}`, 500);
  }
};

export const likePostService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { user: { select: { isActive: true } } },
  });
  if (!post || !post.user.isActive)
    throw new AppError('Post not found or user inactive', 404);

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existingLike) throw new AppError('Post already liked', 400);

  try {
    await prisma.like.create({ data: { userId, postId } });
    const likeCount = await prisma.like.count({ where: { postId } });
    return likeCount;
  } catch (error) {
    throw new AppError(`Failed to like post: ${error.message}`, 500);
  }
};

export const unlikePostService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingLike) throw new AppError('Post not liked', 400);

  try {
    await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
    const likeCount = await prisma.like.count({ where: { postId } });
    return likeCount;
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Like not found', 404);
    throw new AppError(`Failed to unlike post: ${error.message}`, 500);
  }
};

export const addCommentService = async (postId, userId, { content }) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { user: { select: { isActive: true } } },
  });
  if (!post || !post.user.isActive)
    throw new AppError('Post not found or user inactive', 404);

  try {
    const comment = await prisma.comment.create({
      data: { content, userId, postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatar: comment.user.avatar,
      },
    };
  } catch (error) {
    throw new AppError(`Failed to add comment: ${error.message}`, 500);
  }
};

export const updateCommentService = async (commentId, userId, { content }) => {
  if (!isValidUUID(commentId))
    throw new AppError('Invalid comment ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId !== userId)
    throw new AppError('Unauthorized to update this comment', 403);

  try {
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      user: {
        id: updatedComment.user.id,
        username: updatedComment.user.username,
        avatar: updatedComment.user.avatar,
      },
    };
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Comment not found', 404);
    throw new AppError(`Failed to update comment: ${error.message}`, 500);
  }
};

export const deleteCommentService = async (commentId, userId) => {
  if (!isValidUUID(commentId))
    throw new AppError('Invalid comment ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId !== userId)
    throw new AppError('Unauthorized to delete this comment', 403);

  try {
    await prisma.comment.delete({ where: { id: commentId } });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Comment not found', 404);
    throw new AppError(`Failed to delete comment: ${error.message}`, 500);
  }
};

export const savePostService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { user: { select: { isActive: true } } },
  });
  if (!post || !post.user.isActive)
    throw new AppError('Post not found or user inactive', 404);

  const existingSave = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existingSave) throw new AppError('Post already saved', 400);

  try {
    await prisma.savedPost.create({ data: { userId, postId } });
    return { isSaved: true };
  } catch (error) {
    throw new AppError(`Failed to save post: ${error.message}`, 500);
  }
};

export const unsavePostService = async (postId, userId) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);

  const existingSave = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingSave) throw new AppError('Post not saved', 400);

  try {
    await prisma.savedPost.delete({
      where: { userId_postId: { userId, postId } },
    });
    return { isSaved: false };
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Saved post not found', 404);
    throw new AppError(`Failed to unsave post: ${error.message}`, 500);
  }
};

export const getSavedPostsService = async ({ userId, page, pageSize }) => {
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);
  if (page < 1 || pageSize < 1 || pageSize > 50)
    throw new AppError('Invalid page or pageSize', 400);

  const skip = (page - 1) * pageSize;

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.savedPost.findMany({
        where: { userId, post: { user: { isActive: true } } },
        select: {
          post: {
            select: {
              id: true,
              content: true,
              images: true,
              createdAt: true,
              updatedAt: true,
              user: { select: { id: true, username: true, avatar: true } },
              _count: { select: { likes: true, comments: true } },
              likes: userId
                ? { where: { userId }, select: { id: true } }
                : false,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { post: { createdAt: 'desc' } },
      }),
      prisma.savedPost.count({
        where: { userId, post: { user: { isActive: true } } },
      }),
    ]);

    return {
      posts: posts.map(({ post }) => ({
        id: post.id,
        content: post.content,
        images: post.images,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
        },
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: userId ? post.likes.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch saved posts: ${error.message}`, 500);
  }
};

export const getPostCommentsService = async ({
  postId,
  userId,
  page,
  pageSize,
}) => {
  if (!isValidUUID(postId)) throw new AppError('Invalid post ID format', 400);
  if (!isValidUUID(userId)) throw new AppError('Invalid user ID format', 400);
  if (page < 1 || pageSize < 1 || pageSize > 50)
    throw new AppError('Invalid page or pageSize', 400);

  const skip = (page - 1) * pageSize;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { user: { select: { isActive: true } } },
  });
  if (!post || !post.user.isActive)
    throw new AppError('Post not found or user inactive', 404);

  try {
    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where: { postId, user: { isActive: true } },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { postId, user: { isActive: true } } }),
    ]);

    return {
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          avatar: comment.user.avatar,
        },
        isOwner: comment.user.id === userId,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch comments: ${error.message}`, 500);
  }
};
