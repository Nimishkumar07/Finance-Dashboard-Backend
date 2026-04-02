const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Generate JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Register a new user.
 * - Checks for duplicate email
 * - Creates user with hashed password (handled by model middleware)
 * - Returns user data + JWT token
 */
const register = async ({ name, email, password }) => {
  // Check if email already taken
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Authenticate a user with email/password.
 * - Validates credentials
 * - Rejects inactive accounts
 * - Updates lastLoginAt timestamp
 * - Returns user data + JWT token
 */
const login = async ({ email, password }) => {
  // Find user and explicitly include password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if account is active
  if (user.status === 'inactive') {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

module.exports = { register, login };
