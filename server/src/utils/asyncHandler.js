/**
 * Wraps an async Express route handler to forward errors to next().
 * Eliminates boilerplate try/catch in every controller.
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
