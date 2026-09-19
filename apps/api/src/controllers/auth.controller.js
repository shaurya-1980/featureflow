/**
 * controllers/auth.controller.js
 *
 * Handles all authentication endpoints. Every function here is an Express
 * request handler wrapped in catchAsync — errors are forwarded to the
 * centralized errorHandler middleware.
 *
 * Security invariants maintained throughout:
 *  - No user enumeration: identical error messages/status codes for
 *    "user not found" vs "wrong password" on login, and for "email not found"
 *    on forgot-password.
 *  - Tokens stored in DB as SHA-256 hashes — raw tokens only in cookies /
 *    simulated email responses.
 *  - passwordHash field never returned in any response.
 *  - Refresh tokens: httpOnly cookie only, never in response body.
 *  - Token theft detection via revoked-token reuse → family revocation.
 */

import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashPassword, comparePassword } from '../services/password.service.js';
import {
  signAccessToken,
  createAndStoreRefreshToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
  hashToken,
  generateRawToken,
  rotateRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
} from '../services/token.service.js';
import { successResponse, createdResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

// ---------------------------------------------------------------------------
// Helper: build the safe user object returned in responses (no passwordHash).
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Check for duplicate email before creating the user.
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Hash the password — never store raw passwords.
  const passwordHash = await hashPassword(password);

  // Generate a random verification token and store only its hash + expiry.
  const rawVerificationToken = generateRawToken();
  const emailVerificationToken = hashToken(rawVerificationToken);
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerificationToken,
    emailVerificationExpires,
    isEmailVerified: false,
  });

  // SIMULATED EMAIL — no real email provider configured.
  // Construct demo verification URL using configured clientOrigin.
  const clientOrigin = (env.clientOrigin || '').split(',')[0].trim().replace(/\/$/, '');
  const demoVerificationUrl = `${clientOrigin}/verify-email?token=${rawVerificationToken}`;

  if (!env.isProduction) {
    // Detailed log for local development.
    console.log(`[auth] DEV — Email verification URL for ${email}: ${demoVerificationUrl}`);
  } else {
    // In production, log simulated flow without exposing sensitive raw token.
    console.log(`[auth] PROD — Demo verification link generated for ${email}`);
  }

  const safeUserData = safeUser(user);

  const responseBody = createdResponse({
    message: 'Account created successfully. Please verify your email using the demo verification link to continue.',
    user: safeUserData,
    demoVerificationUrl,
    devVerificationUrl: demoVerificationUrl, // backward compatibility
    data: {
      user: safeUserData,
      demoVerificationUrl,
    },
  });

  res.status(201).json(responseBody);
};

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email
// ---------------------------------------------------------------------------
export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  const tokenHash = hashToken(token);

  // Find a user with a matching hash AND a non-expired expiry.
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(
      400,
      'Verification token is invalid or has expired. Please request a new one.'
    );
  }

  // Mark verified and clear the one-time token fields.
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json(successResponse({ message: 'Email verified successfully. You can now log in.' }));
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select passwordHash — it's excluded from queries by default.
  const user = await User.findOne({ email }).select('+passwordHash');

  // Use the SAME error for "user not found" and "wrong password" to prevent
  // user enumeration — an attacker must not be able to tell which case failed.
  const INVALID_CREDENTIALS = new ApiError(401, 'Invalid credentials. Please check your email and password.');

  if (!user) {
    // Run a dummy compare to keep timing consistent (prevents timing attacks
    // where a missing user returns faster than a hash compare).
    await comparePassword(password, '$2b$12$invalidsaltandhashfortimingXXXXX');
    throw INVALID_CREDENTIALS;
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw INVALID_CREDENTIALS;
  }

  // Correct credentials but email not yet verified.
  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      'Please verify your email address before logging in. Check your inbox for the verification link.'
    );
  }

  // Issue a short-lived JWT access token.
  const accessToken = signAccessToken(user._id.toString(), user.role);

  // Generate and persist a refresh token, then set it as an httpOnly cookie.
  const rawRefreshToken = await createAndStoreRefreshToken(user._id.toString());
  res.cookie('refreshToken', rawRefreshToken, refreshCookieOptions());

  res.status(200).json(
    successResponse({
      accessToken,
      user: safeUser(user),
    })
  );
};

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
export const refresh = async (req, res) => {
  const rawToken = req.cookies.refreshToken;

  if (!rawToken) {
    throw new ApiError(401, 'No refresh token provided. Please log in again.');
  }

  const tokenHash = hashToken(rawToken);

  // Look up the token document.
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    // Token not in DB at all — invalid or already cleaned up.
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (tokenDoc.revoked) {
    // A revoked token being reused is a theft signal.
    // Revoke the ENTIRE family for this user for safety.
    console.warn(`[auth] SECURITY — Reuse of revoked refresh token detected for user ${tokenDoc.user}. Revoking all sessions.`);
    await revokeAllUserTokens(tokenDoc.user.toString());
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    throw new ApiError(
      401,
      'Session has been revoked for security reasons (possible token theft). Please log in again.'
    );
  }

  if (tokenDoc.expiresAt < new Date()) {
    // Token has expired — TTL index may not have cleaned it yet.
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  // Token is valid — rotate it.
  const rawNewToken = await createAndStoreRefreshToken(tokenDoc.user.toString());
  const newTokenHash = hashToken(rawNewToken);

  // Mark the old token revoked and record the replacement chain.
  await rotateRefreshToken(tokenHash, newTokenHash);

  // Issue a new access token.
  const user = await User.findById(tokenDoc.user);
  if (!user) {
    throw new ApiError(401, 'User not found. Please log in again.');
  }

  const accessToken = signAccessToken(user._id.toString(), user.role);

  res.cookie('refreshToken', rawNewToken, refreshCookieOptions());

  res.status(200).json(successResponse({ accessToken }));
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
export const logout = async (req, res) => {
  const rawToken = req.cookies.refreshToken;

  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    // Best-effort revocation — do not error if the token is already gone.
    await revokeRefreshToken(tokenHash);
  }

  // Clear the cookie using identical path/domain/security options so the browser removes it
  res.clearCookie('refreshToken', clearRefreshCookieOptions());

  res.status(200).json(successResponse({ message: 'Logged out successfully.' }));
};

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Always return the SAME generic message regardless of whether the email
  // exists — prevents user enumeration via this endpoint.
  const GENERIC_RESPONSE = successResponse({
    message: 'If that email is registered, a password reset link has been sent.',
  });

  const user = await User.findOne({ email });

  if (!user) {
    // Return success-shaped response even for unknown emails.
    return res.status(200).json(GENERIC_RESPONSE);
  }

  const rawResetToken = generateRawToken();
  const passwordResetToken = hashToken(rawResetToken);
  const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  // SIMULATED EMAIL — same boundary as signup.
  const devResetUrl = `${env.clientOrigin}/reset-password?token=${rawResetToken}`;

  if (!env.isProduction) {
    console.log(`[auth] DEV — Password reset URL for ${email}: ${devResetUrl}`);
  } else {
    console.log(`[auth] PROD — Password reset token generated for ${email} (not exposed in response)`);
  }

  const responseBody = {
    ...GENERIC_RESPONSE,
    ...(!env.isProduction && { devResetUrl }),
  };

  res.status(200).json(responseBody);
};

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = hashToken(token);

  // Find a user with a matching hash AND a non-expired expiry.
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired. Please request a new one.');
  }

  // Update the password and clear the reset token fields.
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Invalidate all existing sessions — a password reset must force all other
  // devices to re-authenticate with the new password.
  await revokeAllUserTokens(user._id.toString());

  res.status(200).json(successResponse({
    message: 'Password reset successfully. All active sessions have been logged out. Please log in with your new password.',
  }));
};

// ---------------------------------------------------------------------------
// GET /api/auth/me   (protected — authenticate middleware runs first)
// ---------------------------------------------------------------------------
export const getMe = async (req, res) => {
  // req.user.id is set by authenticate middleware from the JWT payload.
  // We do a fresh DB lookup (not trusting JWT payload alone) so we get the
  // current role/verified status, not stale cached values.
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(401, 'User not found. Please log in again.');
  }

  res.status(200).json(successResponse({ user: safeUser(user) }));
};
