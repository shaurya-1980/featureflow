/**
 * middleware/errorHandler.js
 *
 * Central error-handling middleware. Must be registered LAST in app.js after
 * all routes. Express identifies it as an error handler by the 4-argument
 * signature (err, req, res, next).
 *
 * Rules:
 *  - ApiError instances (isOperational: true) → use their own statusCode &
 *    message. Details array (validation errors) is forwarded if present.
 *  - Everything else (unexpected bugs, library errors, etc.) → log the full
 *    error server-side and return a generic 500. Never expose stack traces or
 *    internal messages to the client.
 */

import ApiError from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Handle known, intentional API errors.
  if (err instanceof ApiError && err.isOperational) {
    const body = {
      success: false,
      error: err.message,
    };

    // Only include details array if it's non-empty (e.g. validation failures).
    if (err.details && err.details.length > 0) {
      body.details = err.details;
    }

    return res.status(err.statusCode).json(body);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId format) cleanly as 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path || 'identifier'}: ${err.value}`,
    });
  }

  // Unexpected error — log it fully on the server, send a safe generic message.
  console.error('[errorHandler] Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: 'Something went wrong',
  });
};

export default errorHandler;
