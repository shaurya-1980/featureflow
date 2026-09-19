/**
 * models/RefreshToken.js
 *
 * Stores hashed refresh tokens. The raw opaque token is:
 *   1. Generated in token.service.js using crypto.randomBytes.
 *   2. Sent to the client as an httpOnly cookie.
 *   3. NEVER stored — only its SHA-256 hash is persisted here.
 *
 * When the client presents the cookie, we hash it and query this collection.
 *
 * Token rotation / theft detection:
 *   - Each token has a `revoked` flag and a `replacedByTokenHash` field.
 *   - On refresh: the old document is marked revoked:true and
 *     replacedByTokenHash is set to the new token's hash.
 *   - If a revoked token is presented again → the whole user's token family
 *     is revoked (possible theft detected).
 *
 * Automatic cleanup:
 *   - The TTL index on `expiresAt` (expireAfterSeconds: 0) makes MongoDB
 *     automatically delete expired documents, keeping the collection lean.
 */

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Needed for efficient family-revocation queries.
    },

    // SHA-256 hash of the raw token the client holds.
    tokenHash: {
      type: String,
      required: true,
    },

    // MongoDB TTL index will automatically delete this document after expiresAt.
    expiresAt: {
      type: Date,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },

    // When a token is rotated, this records which new token replaced it.
    // Useful for forensic analysis of token chains.
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt is helpful for auditing.
  }
);

// TTL index: MongoDB background job removes documents once expiresAt has passed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
