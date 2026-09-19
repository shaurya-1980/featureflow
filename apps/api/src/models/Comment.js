/**
 * models/Comment.js
 *
 * Mongoose schema for Comments and Threaded Replies on Feature Requests.
 *
 * Fields:
 *  - post: reference to Post model (required, indexed)
 *  - author: reference to User model (required)
 *  - contentMarkdown: comment text in markdown format (required)
 *  - parentComment: reference to root Comment model (nullable, indexed)
 *    Enforces 1-level threaded replies (replies reference root comment)
 *  - isDeleted: soft-delete flag to preserve thread structure
 *  - deletedAt: timestamp of deletion
 *  - timestamps: createdAt, updatedAt
 */

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },

    contentMarkdown: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },

    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying post discussion chronologically
commentSchema.index({ post: 1, createdAt: 1 });

// Compound index for querying child replies under a root comment
commentSchema.index({ parentComment: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
