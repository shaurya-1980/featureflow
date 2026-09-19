/**
 * middleware/requireRole.js
 *
 * Factory middleware that returns a route guard ensuring the authenticated
 * user has the required role. Must be used AFTER the authenticate middleware
 * (which populates req.user).
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, requireRole('admin'), handler);
 *
 * @param {string} role - The required role string (e.g. 'admin', 'user').
 * @returns {Function} Express middleware.
 */

import ApiError from '../utils/ApiError.js';

const requireRole = (role) => (req, res, next) => {
  // req.user is guaranteed to exist here because authenticate runs first.
  // If somehow it doesn't, this will surface as an unexpected 500, which is
  // correct — it means the route was mis-configured.
  if (!req.user || req.user.role !== role) {
    return next(
      new ApiError(403, `Access denied. This route requires the '${role}' role.`)
    );
  }

  next();
};

export default requireRole;
