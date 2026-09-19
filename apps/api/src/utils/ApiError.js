/**
 * utils/ApiError.js
 *
 * A custom error class that extends the native Error. Controllers and services
 * throw ApiError instances; the centralized errorHandler middleware catches
 * them and maps them to the correct HTTP response.
 *
 * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404).
 * @param {string} message    - Human-readable error message sent to the client.
 * @param {Array}  [details]  - Optional array of validation detail objects
 *                              (e.g. from Zod errors). Omit for non-validation errors.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = []) {
    super(message);

    this.statusCode = statusCode;
    this.details = details; // Array — empty by default, populated for 400 validation errors.
    this.isOperational = true; // Flag to distinguish known errors from unexpected bugs.

    // Maintain proper prototype chain for instanceof checks.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export default ApiError;
