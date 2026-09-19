/**
 * middleware/validate.js
 *
 * Generic Zod-schema validation middleware factory.
 * Runs the given Zod schema against req.body and calls next() on success.
 * On failure, throws an ApiError(400) with the validation details array
 * so the client knows exactly which fields are invalid.
 *
 * Usage:
 *   import { signupSchema } from '../validators/auth.schema.js';
 *   router.post('/signup', validate(signupSchema), catchAsync(authController.signup));
 *
 * @param {import('zod').ZodSchema} schema - A Zod object schema.
 * @returns {Function} Express middleware.
 */

import ApiError from '../utils/ApiError.js';

const validate = (schema, source = 'body') => (req, res, next) => {
  const target = req[source] || {};
  const result = schema.safeParse(target);

  if (!result.success) {
    // Zod's flatten() gives us a field-keyed error map — transform it into
    // a flat array of { field, message } objects for a consistent API shape.
    const details = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return next(new ApiError(400, 'Validation failed', details));
  }

  // Replace target with the parsed (coerced + stripped) data so controllers
  // always work with clean, type-safe values.
  req[source] = result.data;

  next();
};

export default validate;
