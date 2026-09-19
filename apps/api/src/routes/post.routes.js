/**
 * routes/post.routes.js
 *
 * Express routes for Feature Requests (posts) and voting:
 *  - POST   /api/posts          : Create feature request (auth required)
 *  - GET    /api/posts          : Get feature feed (public, optional auth)
 *  - POST   /api/posts/:id/vote : Upvote post atomically (auth required)
 *  - DELETE /api/posts/:id/vote : Remove upvote atomically (auth required)
 */

import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import * as commentController from '../controllers/comment.controller.js';
import authenticate from '../middleware/authenticate.js';
import optionalAuthenticate from '../middleware/optionalAuthenticate.js';
import requireRole from '../middleware/requireRole.js';
import validate from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createPostSchema,
  getPostsQuerySchema,
  postIdParamSchema,
  updatePostStatusSchema,
} from '../validators/post.schema.js';
import { createCommentSchema } from '../validators/comment.schema.js';

const router = Router();

// Create feature request (authenticated)
router.post(
  '/',
  authenticate,
  validate(createPostSchema),
  catchAsync(postController.createPost)
);

// Get feature feed with filtering, pagination, search, sorting (public)
router.get(
  '/',
  optionalAuthenticate,
  validate(getPostsQuerySchema, 'query'),
  catchAsync(postController.getPosts)
);

// -------------------------------------------------------------------------
// IMPORTANT: Literal routes that would otherwise collide with /:id MUST be
// registered BEFORE the parameterized /:id route. Express matches in
// declaration order — a request to /admin/stats would otherwise match /:id
// with id="admin", call Post.findById("admin"), and throw a CastError.
// -------------------------------------------------------------------------

// Admin metrics overview (authenticated, admin only) — MUST be before /:id
router.get(
  '/admin/stats',
  authenticate,
  requireRole('admin'),
  catchAsync(postController.getAdminStats)
);

// Get single feature request by ID (public, optional auth for hasVoted)
router.get(
  '/:id',
  optionalAuthenticate,
  validate(postIdParamSchema, 'params'),
  catchAsync(postController.getPostById)
);

// Create comment or threaded reply on feature request (authenticated)
router.post(
  '/:id/comments',
  authenticate,
  validate(postIdParamSchema, 'params'),
  validate(createCommentSchema),
  catchAsync(commentController.createComment)
);

// Get threaded comments for a feature request (public)
router.get(
  '/:id/comments',
  validate(postIdParamSchema, 'params'),
  catchAsync(commentController.getComments)
);

// Admin status transition (authenticated, admin only)
router.patch(
  '/:id/status',
  authenticate,
  requireRole('admin'),
  validate(postIdParamSchema, 'params'),
  validate(updatePostStatusSchema),
  catchAsync(postController.updatePostStatus)
);

// Admin delete feature request (authenticated, admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(postIdParamSchema, 'params'),
  catchAsync(postController.deletePost)
);

// Atomic upvote (authenticated)
router.post(
  '/:id/vote',
  authenticate,
  validate(postIdParamSchema, 'params'),
  catchAsync(postController.votePost)
);

// Atomic vote removal (authenticated)
router.delete(
  '/:id/vote',
  authenticate,
  validate(postIdParamSchema, 'params'),
  catchAsync(postController.unvotePost)
);

export default router;
