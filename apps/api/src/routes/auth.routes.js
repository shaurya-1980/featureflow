/**
 * routes/auth.routes.js
 *
 * Mounts all authentication endpoints under /api/auth (prefix set in app.js).
 *
 * Middleware applied here:
 *  - authRateLimiter: only on the sensitive endpoints (login, signup, forgot-password).
 *  - validate(schema): Zod validation before the controller runs.
 *  - authenticate: JWT guard for protected routes.
 *  - catchAsync: wraps async controllers so errors propagate to errorHandler.
 */

import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import catchAsync from '../utils/catchAsync.js';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Public auth routes (rate-limited where appropriate).
router.post('/signup',          authRateLimiter, validate(signupSchema),         catchAsync(authController.signup));
router.post(
  '/verify-email',
  (req, res, next) => {
    if (!req.body?.token && req.query?.token) {
      req.body = { ...req.body, token: req.query.token };
    }
    next();
  },
  validate(verifyEmailSchema),
  catchAsync(authController.verifyEmail)
);
router.post('/login',           authRateLimiter, validate(loginSchema),           catchAsync(authController.login));
router.post('/refresh',                                                            catchAsync(authController.refresh));
router.post('/logout',                                                             catchAsync(authController.logout));
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema),  catchAsync(authController.forgotPassword));
router.post('/reset-password',                   validate(resetPasswordSchema),   catchAsync(authController.resetPassword));

// Protected routes.
router.get('/me', authenticate, catchAsync(authController.getMe));

export default router;
