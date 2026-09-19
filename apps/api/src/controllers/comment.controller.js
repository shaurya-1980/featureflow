/**
 * controllers/comment.controller.js
 *
 * Handlers for Threaded Discussions:
 *  - createComment: submit root comment or reply (authenticated)
 *  - getComments: retrieve threaded discussion for a post (public)
 *  - deleteComment: soft-delete comment by author or admin (authenticated)
 */

import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import ApiError from '../utils/ApiError.js';
import { successResponse, createdResponse } from '../utils/ApiResponse.js';

/**
 * POST /api/posts/:id/comments
 * Submit a root comment or threaded reply.
 * Atomically increments post.commentCount.
 */
export const createComment = async (req, res) => {
  const { id: postId } = req.params;
  const { contentMarkdown, parentComment } = req.body;
  const userId = req.user.id;

  // 1. Verify target post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Feature request not found');
  }

  let finalParentId = null;

  // 2. If reply, verify parent comment exists and belongs to the same post
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      throw new ApiError(404, 'Parent comment not found');
    }

    if (parent.post.toString() !== postId.toString()) {
      throw new ApiError(400, 'Parent comment belongs to a different feature request');
    }

    // Enforce 1-level nesting: if parent is already a reply, attach to its root
    finalParentId = parent.parentComment ? parent.parentComment : parent._id;
  }

  // 3. Create the comment
  const comment = await Comment.create({
    post: postId,
    author: userId,
    contentMarkdown,
    parentComment: finalParentId,
    isDeleted: false,
  });

  // 4. Atomically increment post.commentCount
  await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

  // 5. Populate author info
  await comment.populate('author', 'name email role');

  return res.status(201).json(
    createdResponse({
      comment,
      message: 'Comment posted successfully',
    })
  );
};

/**
 * GET /api/posts/:id/comments
 * Public endpoint to fetch comments grouped into 1-level threaded hierarchy.
 */
export const getComments = async (req, res) => {
  const { id: postId } = req.params;

  // 1. Verify target post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Feature request not found');
  }

  // 2. Fetch all comments for this post chronologically (oldest first)
  const rawComments = await Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate('author', 'name email role')
    .lean();

  // 3. Build threaded hierarchy (Root comments -> replies array)
  const rootCommentsMap = new Map();
  const rootCommentsList = [];
  const orphanReplies = [];

  for (const comment of rawComments) {
    const formattedComment = {
      ...comment,
      contentMarkdown: comment.isDeleted ? '[Comment deleted]' : comment.contentMarkdown,
      author: comment.isDeleted
        ? { _id: comment.author?._id || null, name: 'Deleted User', role: 'user' }
        : comment.author,
      replies: [],
    };

    if (!comment.parentComment) {
      rootCommentsMap.set(comment._id.toString(), formattedComment);
      rootCommentsList.push(formattedComment);
    } else {
      const parentId = comment.parentComment.toString();
      if (rootCommentsMap.has(parentId)) {
        rootCommentsMap.get(parentId).replies.push(formattedComment);
      } else {
        orphanReplies.push({ parentId, formattedComment });
      }
    }
  }

  // Attach any orphan replies whose parent appeared later (defensive fallback)
  for (const { parentId, formattedComment } of orphanReplies) {
    if (rootCommentsMap.has(parentId)) {
      rootCommentsMap.get(parentId).replies.push(formattedComment);
    } else {
      rootCommentsList.push(formattedComment);
    }
  }

  const activeCommentsCount = rawComments.filter((c) => !c.isDeleted).length;

  return res.status(200).json(
    successResponse({
      comments: rootCommentsList,
      totalComments: activeCommentsCount,
    })
  );
};

/**
 * DELETE /api/comments/:id
 * Soft-delete a comment by author or admin.
 * Atomically decrements post.commentCount (never below 0).
 */
export const deleteComment = async (req, res) => {
  const { id: commentId } = req.params;
  const currentUserId = req.user.id.toString();
  const currentUserRole = req.user.role;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check authorization: author or admin
  const isAuthor = comment.author.toString() === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw new ApiError(403, 'You do not have permission to delete this comment');
  }

  // If already deleted, return idempotently
  if (comment.isDeleted) {
    return res.status(200).json(
      successResponse({
        message: 'Comment is already deleted',
      })
    );
  }

  // Soft-delete comment
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  comment.contentMarkdown = '[Comment deleted]';
  await comment.save();

  // Atomically decrement post.commentCount safely
  await Post.findOneAndUpdate(
    { _id: comment.post, commentCount: { $gt: 0 } },
    { $inc: { commentCount: -1 } }
  );

  return res.status(200).json(
    successResponse({
      message: 'Comment deleted successfully',
    })
  );
};
