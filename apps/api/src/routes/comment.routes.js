/**
 * routes/comment.routes.js
 *
 * Express routes for comment actions:
 *  - DELETE /api/comments/:id : Soft-delete comment (auth required)
 */

import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import catchAsync from '../utils/catchAsync.js';
import { commentIdParamSchema } from '../validators/comment.schema.js';

const router = Router();

// Delete a comment (authenticated: author or admin)
router.delete(
  '/:id',
  authenticate,
  validate(commentIdParamSchema, 'params'),
  catchAsync(commentController.deleteComment)
);

export default router;
