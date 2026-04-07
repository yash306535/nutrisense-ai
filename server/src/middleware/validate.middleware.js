const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Zod validation middleware factory.
 * Validates req.body, req.params, or req.query against a Zod schema.
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'params'|'query'} source - Which part of the request to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const result = schema.parse(req[source]);
    req[source] = result; // Replace with parsed/coerced values
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return next(new ApiError(400, 'Validation failed', errors));
    }
    next(err);
  }
};

module.exports = { validate };
