/**
 * validators/comment.schema.js
 *
 * Zod schemas for comment creation, post/comment ID route parameters.
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCommentSchema = z.object({
  contentMarkdown: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters'),

  parentComment: z
    .string()
    .regex(objectIdRegex, 'Invalid parent comment ID format')
    .nullable()
    .optional(),
});

export const postIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Post ID is required' })
    .regex(objectIdRegex, 'Invalid post ID format: must be a 24-character hexadecimal ObjectId'),
});

export const commentIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Comment ID is required' })
    .regex(objectIdRegex, 'Invalid comment ID format: must be a 24-character hexadecimal ObjectId'),
});
