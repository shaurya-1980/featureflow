/**
 * services/token.service.js
 *
 * Centralises all token-related logic:
 *   - JWT access token signing
 *   - Opaque refresh token generation and hashing
 *   - SHA-256 hashing (used for storing verification/reset tokens safely)
 *   - Refresh token DB persistence (save / revoke / family-revoke)
 *   - Cookie configuration (single source of truth — never duplicated)
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import env from '../config/env.js';

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/**
 * Creates a SHA-256 hex digest of the given string.
 * Used to hash raw tokens before storing them in the DB so the DB never
 * contains anything that could directly authenticate a user if leaked.
 *
 * @param {string} rawToken - The raw, opaque token string.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
export const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

// ---------------------------------------------------------------------------
// Random token generation (for email verification / password reset)
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random hex string (64 characters = 32 bytes).
 * @returns {string} Raw token to send to the user.
 */
export const generateRawToken = () => crypto.randomBytes(32).toString('hex');

// ---------------------------------------------------------------------------
// JWT Access Token
// ---------------------------------------------------------------------------

/**
 * Signs and returns a short-lived JWT access token.
 * Payload: { sub: userId, role } — only the minimum identity info needed.
 *
 * @param {string} userId - MongoDB ObjectId string.
 * @param {string} role   - User role ('user' | 'admin').
 * @returns {string} Signed JWT.
 */
export const signAccessToken = (userId, role) =>
  jwt.sign(
    { sub: userId, role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );

// ---------------------------------------------------------------------------
// Opaque Refresh Token
// ---------------------------------------------------------------------------

/**
 * Generates a new opaque refresh token, hashes it, and persists the hash to
 * the RefreshToken collection.
 *
 * @param {string} userId - MongoDB ObjectId string.
 * @returns {Promise<string>} The raw token (to be set as an httpOnly cookie).
 */
export const createAndStoreRefreshToken = async (userId) => {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + env.refreshToken.expiresInDays * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({ user: userId, tokenHash, expiresAt });

  return rawToken; // Only the raw token leaves this function — hash stays in DB.
};

// ---------------------------------------------------------------------------
// Cookie configuration — single source of truth
// ---------------------------------------------------------------------------

/**
 * Returns the cookie options object for the refresh token cookie.
 * Centralised here so all three places that touch this cookie
 * (login, refresh, logout) use identical settings — mismatched options
 * cause browsers to silently fail to clear cookies.
 */
export const refreshCookieOptions = () => ({
  httpOnly: true,                                        // Not accessible via JS.
  secure: env.isProduction,                             // HTTPS only in production.
  sameSite: 'strict',                                   // Mitigate CSRF.
  path: '/api/auth',                                    // Cookie only sent to auth routes.
  maxAge: env.refreshToken.expiresInDays * 24 * 60 * 60 * 1000,
});

/**
 * Returns options for res.clearCookie (omitting maxAge to comply with Express 5+).
 */
export const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: '/api/auth',
});

// ---------------------------------------------------------------------------
// Refresh token DB helpers
// ---------------------------------------------------------------------------

/**
 * Marks the RefreshToken document with the given hash as revoked and records
 * which new token hash replaced it (for token-chain auditing).
 *
 * @param {string} oldTokenHash      - Hash of the token being rotated out.
 * @param {string} newTokenHash      - Hash of the new replacement token.
 * @returns {Promise<void>}
 */
export const rotateRefreshToken = async (oldTokenHash, newTokenHash) => {
  await RefreshToken.findOneAndUpdate(
    { tokenHash: oldTokenHash },
    { revoked: true, replacedByTokenHash: newTokenHash }
  );
};

/**
 * Revokes every non-expired refresh token for the given user.
 * Called when a reused (already-revoked) token is detected (theft signal)
 * or when a password reset forces all sessions to end.
 *
 * @param {string} userId - MongoDB ObjectId string.
 * @returns {Promise<void>}
 */
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    { revoked: true }
  );
};

/**
 * Marks a single refresh token as revoked (used on logout).
 *
 * @param {string} tokenHash - Hash of the token to revoke.
 * @returns {Promise<void>}
 */
export const revokeRefreshToken = async (tokenHash) => {
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
};
