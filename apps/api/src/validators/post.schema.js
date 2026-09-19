/**
 * validators/post.schema.js
 *
 * Zod schemas for post creation, querying/filtering/sorting, and route parameter validation.
 */

import { z } from 'zod';
import { POST_CATEGORIES, POST_STATUSES } from '../models/Post.js';

export const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),

  descriptionMarkdown: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description cannot be empty'),

  category: z.enum(POST_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${POST_CATEGORIES.join(', ')}`,
    }),
  }),
});

export const getPostsQuerySchema = z.object({
  page: z
    .preprocess((val) => (val !== undefined ? Number(val) : 1), z.number().int().min(1, 'Page must be at least 1'))
    .default(1),

  limit: z
    .preprocess(
      (val) => (val !== undefined ? Number(val) : 10),
      z.number().int().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50')
    )
    .default(10),

  category: z
    .enum(POST_CATEGORIES, {
      errorMap: () => ({
        message: `Category must be one of: ${POST_CATEGORIES.join(', ')}`,
      }),
    })
    .optional(),

  status: z
    .enum(POST_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${POST_STATUSES.join(', ')}`,
      }),
    })
    .optional(),

  sort: z
    .enum(['newest', 'upvoted', 'discussed', 'trending'], {
      errorMap: () => ({
        message: 'Sort must be one of: newest, upvoted, discussed, trending',
      }),
    })
    .default('newest'),

  search: z.string().trim().optional(),
});

export const postIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format: must be a 24-character hexadecimal ObjectId'),
});

export const updatePostStatusSchema = z.object({
  status: z.enum(POST_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${POST_STATUSES.join(', ')}`,
    }),
  }),
});
