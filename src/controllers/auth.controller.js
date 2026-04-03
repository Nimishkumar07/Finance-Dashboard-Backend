const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  ApiResponse.created(res, 'User registered successfully', result);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  ApiResponse.success(res, 'Login successful', result);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Authenticated
 */
const getMe = catchAsync(async (req, res) => {
  ApiResponse.success(res, 'User profile retrieved', req.user);
});

module.exports = { register, login, getMe };
