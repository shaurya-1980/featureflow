/**
 * middleware/rateLimit.js
 *
 * Exports pre-configured express-rate-limit instances for sensitive auth
 * endpoints. Applied per-route in auth.routes.js — NOT globally — to avoid
 * throttling general API traffic.
 *
 * Window: 15 minutes / 10 requests per IP.
 * Applies to: POST /api/auth/login, /signup, /forgot-password.
 */

import rateLimit from 'express-rate-limit';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // Limit each IP to 10 requests per window.
  standardHeaders: true,     // Return rate limit info in the RateLimit-* headers.
  legacyHeaders: false,      // Disable the deprecated X-RateLimit-* headers.
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  // Use the handler option so the response matches our ApiError shape.
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes.',
    });
  },
});

export { authRateLimiter };
