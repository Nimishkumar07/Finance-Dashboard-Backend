const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Global error handling middleware.
 *
 * Distinguishes between:
 * 1. Operational errors (ApiError) — expected, send clean message to client
 * 2. Mongoose validation errors — convert to 400 with field details
 * 3. Mongoose duplicate key errors — convert to 409 conflict
 * 4. Programming errors — log full error, send generic 500
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', details);
  }

  // Mongoose duplicate key error → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`${field} already exists`);
  }

  // Mongoose bad ObjectId → 400
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error = ApiError.badRequest(`Invalid ID format: ${err.value}`);
  }

  // JWT errors (if not caught by auth middleware)
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';

  // Log non-operational (unexpected) errors
  if (!error.isOperational) {
    console.error('[ERROR] Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors?.length && { errors: error.errors }),
    ...(config.node_env === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
