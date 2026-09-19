/**
 * middleware/optionalAuthenticate.js
 *
 * Checks for a JWT access token in the Authorization header.
 * - If present and valid, attaches { id, role } to req.user.
 * - If absent, malformed, or expired, leaves req.user as null/undefined and
 *   proceeds without error.
 *
 * Used for public endpoints (like GET /api/posts) where anonymous visitors can
 * view content, but authenticated users receive contextual flags (e.g. hasVoted).
 */

import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
  } catch {
    // If invalid or expired, treat as anonymous visitor
    req.user = null;
  }

  next();
};

export default optionalAuthenticate;
