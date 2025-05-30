import { Readable } from 'stream';
import { cloudinaryInstance } from '../config/cloudinary.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

const isValidUUID = id => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const getUsersService = async ({
  query,
  page,
  pageSize,
  currentUserId,
}) => {
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    throw new AppError('Invalid page or pageSize', 400);
  }
  if (currentUserId && !isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  const skip = (page - 1) * pageSize;
  const where = query
    ? {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      }
    : { isActive: true };

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          bio: true,
          avatar: true,
          _count: {
            select: { followers: true, following: true },
          },
          followers: currentUserId
            ? { where: { followerId: currentUserId }, select: { id: true } }
            : false,
        },
        skip,
        take: pageSize,
        orderBy: { username: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: currentUserId ? user.followers.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch users: ${error.message}`, 500);
  }
};

export const getUserByIdService = async (userId, currentUserId) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  if (currentUserId && !isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true, following: true },
        },
        followers: currentUserId
          ? { where: { followerId: currentUserId }, select: { id: true } }
          : false,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      postCount: user._count.posts,
      createdAt: user.createdAt,
      isFollowing: currentUserId ? user.followers.length > 0 : false,
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw new AppError(`Failed to fetch user: ${error.message}`, 500);
  }
};

export const updateProfileService = async (userId, { bio }) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  if (bio && (typeof bio !== 'string' || bio.length > 500)) {
    throw new AppError(
      'Bio must be a string and less than 500 characters',
      400
    );
  }
  try {
    const user = await prisma.user.update({
      where: { id: userId, isActive: true },
      data: { bio },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
      },
    });
    return user;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError(
        'User not found or inactive. Cannot update profile.',
        404
      );
    }
    throw new AppError(`Failed to update profile: ${error.message}`, 500);
  }
};

export const resetAvatarService = async userId => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: { id: true, avatar: true },
  });
  if (!user) {
    throw new AppError('User not found or inactive', 404);
  }

  // Only delete if current avatar isn't default
  if (
    user.avatar &&
    user.avatar !== process.env.CLOUDINARY_DEFAULT_AVATAR_URL
  ) {
    try {
      await cloudinaryInstance.uploader.destroy(
        `sociofeed/avatars/${userId}_profile`,
        {
          invalidate: true,
        }
      );
      console.log(`Deleted Cloudinary avatar for user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to delete Cloudinary avatar for user ${userId}:`,
        error.message
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar: process.env.CLOUDINARY_DEFAULT_AVATAR_URL },
    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });
  return updatedUser;
};

export const updateAvatarService = async (userId, file) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: { id: true, avatar: true },
  });
  if (!user) {
    throw new AppError('User not found or inactive', 404);
  }

  let avatarUrl = process.env.CLOUDINARY_DEFAULT_AVATAR_URL;
  if (file) {
    const stream = Readable.from(file.buffer);
    const publicId = `${userId}_profile`;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'sociofeed/avatars',
          public_id: publicId,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          invalidate: true,
          tags: ['avatar', `user_${userId}`],
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(
              new AppError(`Cloudinary upload failed: ${error.message}`, 500)
            );
          }
          resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

    avatarUrl = uploadResult.secure_url;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });

  return updatedUser;
};

export const followUserService = async (followerId, followingId) => {
  if (!isValidUUID(followerId) || !isValidUUID(followingId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  try {
    const followedUser = await prisma.user.findUnique({
      where: { id: followingId, isActive: true },
    });
    if (!followedUser) {
      throw new AppError('User not found or inactive', 404);
    }
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existingFollow) {
      throw new AppError('Already following this user', 400);
    }
    await prisma.follow.create({
      data: { followerId, followingId },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError('User not found or inactive', 404);
    }
    throw new AppError(`Failed to follow user: ${error.message}`, 500);
  }
};

export const unfollowUserService = async (followerId, followingId) => {
  if (!isValidUUID(followerId) || !isValidUUID(followingId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  try {
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!existingFollow) {
      throw new AppError('Not following this user', 400);
    }
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError('Follow relationship not found', 404);
    }
    throw new AppError(`Failed to unfollow user: ${error.message}`, 500);
  }
};

export const getFollowersService = async ({
  userId,
  query,
  page,
  pageSize,
  currentUserId,
}) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  if (currentUserId && !isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    throw new AppError('Invalid page or pageSize', 400);
  }
  const skip = (page - 1) * pageSize;
  const userExists = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
  });
  if (!userExists) {
    throw new AppError('User not found or inactive', 404);
  }
  const where = {
    followingId: userId,
    follower: {
      isActive: true,
      ...(query && {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      }),
    },
  };

  try {
    const [followers, total] = await prisma.$transaction([
      prisma.follow.findMany({
        where,
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              bio: true,
              avatar: true,
              _count: { select: { followers: true, following: true } },
              followers: currentUserId
                ? { where: { followerId: currentUserId }, select: { id: true } }
                : false,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { follower: { username: 'asc' } },
      }),
      prisma.follow.count({ where }),
    ]);

    return {
      users: followers.map(({ follower }) => ({
        id: follower.id,
        username: follower.username,
        bio: follower.bio,
        avatar: follower.avatar,
        followerCount: follower._count.followers,
        followingCount: follower._count.following,
        isFollowing: currentUserId ? follower.followers.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch followers: ${error.message}`, 500);
  }
};

export const getFollowingService = async ({
  userId,
  query,
  page,
  pageSize,
  currentUserId,
}) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  if (currentUserId && !isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    throw new AppError('Invalid page or pageSize', 400);
  }
  const skip = (page - 1) * pageSize;
  const userExists = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
  });
  if (!userExists) {
    throw new AppError('User not found or inactive', 404);
  }
  const where = {
    followerId: userId,
    following: {
      isActive: true,
      ...(query && {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      }),
    },
  };

  try {
    const [following, total] = await prisma.$transaction([
      prisma.follow.findMany({
        where,
        select: {
          following: {
            select: {
              id: true,
              username: true,
              bio: true,
              avatar: true,
              _count: { select: { followers: true, following: true } },
              followers: currentUserId
                ? { where: { followerId: currentUserId }, select: { id: true } }
                : false,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { following: { username: 'asc' } },
      }),
      prisma.follow.count({ where }),
    ]);

    return {
      users: following.map(({ following }) => ({
        id: following.id,
        username: following.username,
        bio: following.bio,
        avatar: following.avatar,
        followerCount: following._count.followers,
        followingCount: following._count.following,
        isFollowing: currentUserId ? following.followers.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch following: ${error.message}`, 500);
  }
};

export const getUserPostsService = async ({
  userId,
  page,
  pageSize,
  currentUserId,
}) => {
  if (!isValidUUID(userId)) {
    throw new AppError('Invalid user ID format', 400);
  }
  if (currentUserId && !isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    throw new AppError('Invalid page or pageSize', 400);
  }
  const skip = (page - 1) * pageSize;
  const userExists = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
  });
  if (!userExists) {
    throw new AppError('User not found or inactive', 404);
  }

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where: { userId, user: { isActive: true } },
        select: {
          id: true,
          content: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { likes: true, comments: true } },
          likes: currentUserId
            ? { where: { userId: currentUserId }, select: { id: true } }
            : false,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: { userId, user: { isActive: true } } }),
    ]);

    return {
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        images: post.images,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: currentUserId ? post.likes.length > 0 : false,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch posts: ${error.message}`, 500);
  }
};

export const getUserSuggestionsService = async ({
  currentUserId,
  page,
  pageSize,
}) => {
  if (!isValidUUID(currentUserId)) {
    throw new AppError('Invalid current user ID format', 400);
  }
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    throw new AppError('Invalid page or pageSize', 400);
  }
  const skip = (page - 1) * pageSize;

  const where = {
    id: { not: currentUserId },
    isActive: true,
    followers: {
      none: { followerId: currentUserId },
    },
  };

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          bio: true,
          avatar: true,
          _count: { select: { followers: true, following: true } },
          followers: {
            where: { followerId: currentUserId },
            select: { id: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { followers: { _count: 'desc' } },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: user.followers.length > 0,
      })),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AppError(`Failed to fetch suggestions: ${error.message}`, 500);
  }
};
