/**
 * validators/auth.schema.js
 *
 * Zod schemas for all authentication-related request bodies.
 * These are consumed by the validate() middleware factory.
 *
 * Rules enforced here:
 *   - email: valid email format, lowercased
 *   - password: min 8 chars, at least one letter AND one number
 *   - name: 2–50 chars, trimmed
 *   - token (verification/reset): non-empty string
 */

import { z } from 'zod';

// Reusable field definitions.
const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)/,
    'Password must contain at least one letter and one number'
  );

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: emailField,
  password: passwordField,
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email
// ---------------------------------------------------------------------------
export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Verification token is required' })
    .min(1, 'Verification token is required'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
export const forgotPasswordSchema = z.object({
  email: emailField,
});

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  newPassword: passwordField,
});
