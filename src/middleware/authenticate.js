const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Authentication middleware.
 * Verifies JWT from Authorization header and attaches the user to req.user.
 * Also rejects inactive users even if their token is valid.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid token.');
    }

    // 3. Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists.');
    }
    if (user.status === 'inactive') {
      throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
