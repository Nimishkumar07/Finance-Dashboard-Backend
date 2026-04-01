/**
 * Wraps an async route handler to catch errors and forward them
 * to Express error-handling middleware.
 *
 * Eliminates repetitive try/catch blocks in every controller.
 *
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
