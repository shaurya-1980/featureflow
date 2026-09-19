/**
 * utils/ApiResponse.js
 *
 * Tiny helpers to build consistent success response shapes.
 * Every successful response follows: { success: true, ...data }
 *
 * Usage in a controller:
 *   res.status(200).json(successResponse({ user }));
 *   res.status(201).json(createdResponse({ message: 'User created' }));
 */

/**
 * Build a generic success response payload.
 * @param {Object} data - Any additional key-value pairs to merge into the response.
 * @returns {{ success: true } & data}
 */
export const successResponse = (data = {}) => ({
  success: true,
  ...data,
});

/**
 * Alias that communicates intent for 201-style responses.
 * Identical to successResponse — calling code uses this name for clarity.
 */
export const createdResponse = (data = {}) => ({
  success: true,
  ...data,
});
