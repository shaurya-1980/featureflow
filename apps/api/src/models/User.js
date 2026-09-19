/**
 * models/User.js
 *
 * Mongoose schema for application users.
 *
 * Security notes:
 *  - passwordHash is stored (never the raw password) and marked select:false
 *    so it is never accidentally included in query results. Controllers that
 *    need it must explicitly request it: User.findOne(...).select('+passwordHash').
 *  - emailVerificationToken and passwordResetToken are also select:false and
 *    store SHA-256 hashes of the raw tokens — the raw token is sent to the
 *    user (simulated email) and used to look up the hash in the DB.
 *  - email is lowercased at the schema level to ensure consistent lookup.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Never store the raw password — only the bcrypt hash.
    // select: false ensures this field is excluded from all queries by default.
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"',
      },
      default: 'user',
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Stores the SHA-256 hash of the verification token, not the raw token.
    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Stores the SHA-256 hash of the reset token, not the raw token.
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically.
  }
);

const User = mongoose.model('User', userSchema);

export default User;
