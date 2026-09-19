/**
 * controllers/post.controller.js
 *
 * Controller handlers for Feature Requests:
 *  - createPost: create a new feature request (authenticated)
 *  - getPosts: public feed with pagination, filtering, search, sorting & trending
 *  - votePost: atomic upvote with duplicate vote prevention (authenticated)
 *  - unvotePost: atomic vote removal with nonexistent vote guard (authenticated)
 */

import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import { successResponse, createdResponse } from '../utils/ApiResponse.js';

/**
 * Escape special characters in regex queries to prevent ReDoS / injection
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * POST /api/posts
 * Create a new feature request.
 * Required: title, descriptionMarkdown, category.
 * Author is derived strictly from req.user.id (never accepted from request body).
 */
export const createPost = async (req, res) => {
  const { title, descriptionMarkdown, category } = req.body;

  const post = await Post.create({
    title,
    descriptionMarkdown,
    category,
    author: req.user.id,
    status: 'Under Review',
    votes: [],
    voteCount: 0,
    commentCount: 0,
  });

  await post.populate('author', 'name email');

  const postData = post.toObject();
  delete postData.votes;

  return res.status(201).json(
    createdResponse({
      post: {
        ...postData,
        hasVoted: false,
      },
      message: 'Feature request submitted successfully',
    })
  );
};

/**
 * GET /api/posts
 * Public feed endpoint with pagination, category/status filters, search, and sorting.
 * If user is authenticated, hasVoted is computed dynamically per post.
 */
export const getPosts = async (req, res) => {
  const { page = 1, limit = 10, category, status, sort = 'newest', search } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Build query filter
  const matchQuery = {};

  if (category) {
    matchQuery.category = category;
  }

  if (status) {
    matchQuery.status = status;
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    matchQuery.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { descriptionMarkdown: { $regex: escaped, $options: 'i' } },
    ];
  }

  const total = await Post.countDocuments(matchQuery);
  const currentUserId = req.user?.id ? req.user.id.toString() : null;

  let rawPosts = [];

  if (sort === 'trending') {
    // Trending formula: score = voteCount / ((ageInHours + 2) ^ 1.5)
    // where ageInHours = (current_time - createdAt) / 3600000
    const now = new Date();

    rawPosts = await Post.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          ageInHours: {
            $divide: [{ $subtract: [now, '$createdAt'] }, 3600000],
          },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $divide: [
              '$voteCount',
              { $pow: [{ $add: ['$ageInHours', 2] }, 1.5] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { _id: 1, name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
    ]);
  } else {
    const sortOptions = {};
    if (sort === 'upvoted') {
      sortOptions.voteCount = -1;
      sortOptions.createdAt = -1;
    } else if (sort === 'discussed') {
      sortOptions.commentCount = -1;
      sortOptions.createdAt = -1;
    } else {
      // Default: newest
      sortOptions.createdAt = -1;
    }

    rawPosts = await Post.find(matchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email')
      .lean();
  }

  // Sanitize posts: compute hasVoted and strip the raw votes array
  const posts = rawPosts.map((post) => {
    const hasVoted = Boolean(
      currentUserId && post.votes?.some((v) => v.toString() === currentUserId)
    );
    const { votes, ageInHours, trendingScore, ...rest } = post;
    return {
      ...rest,
      hasVoted,
    };
  });

  return res.status(200).json(
    successResponse({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 0,
      },
    })
  );
};

/**
 * POST /api/posts/:id/vote
 * Atomically records an upvote and increments voteCount by 1.
 * Prevents duplicate voting using atomic conditional query { _id, votes: { $ne: userId } }.
 */
export const votePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updatedPost = await Post.findOneAndUpdate(
    { _id: id, votes: { $ne: userId } },
    {
      $addToSet: { votes: userId },
      $inc: { voteCount: 1 },
    },
    { new: true, runValidators: true }
  );

  if (!updatedPost) {
    const existing = await Post.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Feature request not found');
    }

    // User already voted — return current count idempotently without incrementing
    return res.status(200).json(
      successResponse({
        voteCount: existing.voteCount,
        hasVoted: true,
        message: 'You have already voted for this feature request',
      })
    );
  }

  return res.status(200).json(
    successResponse({
      voteCount: updatedPost.voteCount,
      hasVoted: true,
    })
  );
};

/**
 * DELETE /api/posts/:id/vote
 * Atomically removes an upvote and decrements voteCount by 1.
 * Ensures voteCount never decrements if the user had not voted.
 */
export const unvotePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updatedPost = await Post.findOneAndUpdate(
    { _id: id, votes: userId },
    {
      $pull: { votes: userId },
      $inc: { voteCount: -1 },
    },
    { new: true, runValidators: true }
  );

  if (!updatedPost) {
    const existing = await Post.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Feature request not found');
    }

    // User had not voted — return current count without decrementing
    return res.status(200).json(
      successResponse({
        voteCount: existing.voteCount,
        hasVoted: false,
        message: 'No vote to remove',
      })
    );
  }

  return res.status(200).json(
    successResponse({
      voteCount: updatedPost.voteCount,
      hasVoted: false,
    })
  );
};

/**
 * GET /api/posts/:id
 * Retrieve a single feature request by its ID.
 * Returns safe post object, author details, and personalized hasVoted flag.
 */
export const getPostById = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?.id ? req.user.id.toString() : null;

  const post = await Post.findById(id).populate('author', 'name email role').lean();

  if (!post) {
    throw new ApiError(404, 'Feature request not found');
  }

  const hasVoted = Boolean(
    currentUserId && post.votes?.some((v) => v.toString() === currentUserId)
  );

  const { votes, ...rest } = post;

  return res.status(200).json(
    successResponse({
      post: {
        ...rest,
        hasVoted,
      },
    })
  );
};

/**
 * PATCH /api/posts/:id/status
 * Admin-only status transition handler.
 * Updates workflow status of a feature request.
 */
export const updatePostStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const currentUserId = req.user?.id ? req.user.id.toString() : null;

  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, 'Feature request not found');
  }

  post.status = status;
  await post.save();
  await post.populate('author', 'name email role');

  const postData = post.toObject();
  const hasVoted = Boolean(
    currentUserId && postData.votes?.some((v) => v.toString() === currentUserId)
  );
  delete postData.votes;

  return res.status(200).json(
    successResponse({
      post: {
        ...postData,
        hasVoted,
      },
      message: `Status updated to '${status}' successfully`,
    })
  );
};

/**
 * GET /api/posts/admin/stats
 * Admin-only summary metrics for moderation dashboard.
 */
export const getAdminStats = async (req, res) => {
  const [total, underReview, planned, inProgress, completed] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: 'Under Review' }),
    Post.countDocuments({ status: 'Planned' }),
    Post.countDocuments({ status: 'In Progress' }),
    Post.countDocuments({ status: 'Completed' }),
  ]);

  return res.status(200).json(
    successResponse({
      stats: {
        total,
        underReview,
        planned,
        inProgress,
        completed,
      },
    })
  );
};

/**
 * DELETE /api/posts/:id
 * Admin-only feature deletion handler.
 * Deletes the feature request and any associated comments.
 */
export const deletePost = async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, 'Feature request not found');
  }

  await Post.findByIdAndDelete(id);
  await Comment.deleteMany({ post: id });

  return res.status(200).json(
    successResponse({
      message: 'Feature request deleted successfully',
    })
  );
};

