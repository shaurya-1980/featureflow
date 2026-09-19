/**
 * models/Post.js
 *
 * Mongoose schema for Feature Requests (Posts).
 *
 * Attributes:
 *  - title: short descriptive summary (max 200 chars).
 *  - descriptionMarkdown: markdown-formatted description of the feature request.
 *  - category: UI/UX | Integrations | Performance | General.
 *  - author: reference to User model.
 *  - status: Under Review | Planned | In Progress | Completed (defaults to 'Under Review').
 *  - votes: array of User ObjectIds who voted for this post.
 *  - voteCount: counter cached on the post for high-performance sorting/indexing.
 *  - commentCount: counter cached for card UI and future comment system (Phase 3).
 *
 * Indexing Strategy:
 *  - Text index on title & descriptionMarkdown for full-text search.
 *  - Compound indexes on category + status + sort fields (createdAt, voteCount, commentCount)
 *    to ensure index-covered queries when filtering and sorting feeds.
 */

import mongoose from 'mongoose';

export const POST_CATEGORIES = ['UI/UX', 'Integrations', 'Performance', 'General'];
export const POST_STATUSES = ['Under Review', 'Planned', 'In Progress', 'Completed'];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    descriptionMarkdown: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: POST_CATEGORIES,
        message: 'Category must be one of: {VALUE}',
      },
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: POST_STATUSES,
        message: 'Status must be one of: {VALUE}',
      },
      default: 'Under Review',
      index: true,
    },

    votes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },

    voteCount: {
      type: Number,
      default: 0,
      min: [0, 'Vote count cannot be negative'],
    },

    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes for feed queries, filtering, sorting, and search
// ---------------------------------------------------------------------------

// Text index across title (higher weight) and descriptionMarkdown
postSchema.index(
  { title: 'text', descriptionMarkdown: 'text' },
  { weights: { title: 5, descriptionMarkdown: 1 }, name: 'PostTextIndex' }
);

// Compound indexes for filtered feed queries
postSchema.index({ category: 1, status: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1, voteCount: -1 });
postSchema.index({ category: 1, status: 1, commentCount: -1 });
postSchema.index({ status: 1, voteCount: -1 });
postSchema.index({ status: 1, commentCount: -1 });
postSchema.index({ status: 1, createdAt: -1 });

// Standalone sort indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ voteCount: -1 });
postSchema.index({ commentCount: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
