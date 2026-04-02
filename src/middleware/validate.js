const ApiError = require('../utils/ApiError');

/**
 * Request validation middleware factory.
 * Uses Joi schemas to validate request body, query params, or URL params.
 *
 * Usage:
 *   router.post('/records', validate(recordSchema, 'body'), controller);
 *   router.get('/records', validate(filterSchema, 'query'), controller);
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Collect ALL errors, not just the first
      stripUnknown: true, // Remove unknown fields silently
      errors: {
        wrap: { label: '' }, // Clean error messages without quotes
      },
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(ApiError.badRequest('Validation failed', details));
    }

    // Replace with validated (and sanitized) values
    req[source] = value;
    next();
  };
};

module.exports = validate;
