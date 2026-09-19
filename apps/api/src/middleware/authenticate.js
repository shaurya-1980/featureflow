/**
 * middleware/authenticate.js
 *
 * Verifies the JWT access token from the Authorization header.
 * On success, attaches { id, role } to req.user and calls next().
 * On any failure (missing, malformed, expired) → 401.
 *
 * Deliberately uses the same generic message for expired vs. invalid tokens
 * so clients cannot infer internal state — they just know to refresh or re-login.
 */

import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Please log in.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Throws if the token is expired, malformed, or signed with a wrong secret.
    const payload = jwt.verify(token, env.jwt.accessSecret);

    // Attach the minimal identity object — never expose the full payload to
    // downstream middleware/controllers (they only need id + role).
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    // Both jwt.TokenExpiredError and jwt.JsonWebTokenError land here.
    // We intentionally give the same message for both to avoid leaking info.
    next(new ApiError(401, 'Invalid or expired token. Please log in again.'));
  }
};

export default authenticate;
