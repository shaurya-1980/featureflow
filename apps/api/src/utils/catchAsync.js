/**
 * utils/catchAsync.js
 *
 * A higher-order function that wraps async Express route handlers so that any
 * rejected promise (thrown error) is automatically forwarded to Express's
 * next(err) — which routes it to our centralized errorHandler middleware.
 *
 * Without this wrapper, every async controller would need its own try/catch
 * block. With it, controllers can throw ApiError instances directly and stay
 * clean.
 *
 * Usage:
 *   router.post('/login', catchAsync(authController.login));
 *
 * @param {Function} fn - An async Express route handler (req, res, next) => Promise
 * @returns {Function}  - A standard Express middleware that catches errors.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
