const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get all users (paginated, filterable)
 * @route   GET /api/users
 * @access  Admin
 */
const getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);
  ApiResponse.paginated(res, 'Users retrieved successfully', result);
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Admin
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.success(res, 'User retrieved successfully', user);
});

/**
 * @desc    Update user details
 * @route   PATCH /api/users/:id
 * @access  Admin
 */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  ApiResponse.success(res, 'User updated successfully', user);
});

/**
 * @desc    Change user role
 * @route   PATCH /api/users/:id/role
 * @access  Admin
 */
const updateRole = catchAsync(async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.body.role, req.user._id);
  ApiResponse.success(res, 'User role updated successfully', user);
});

/**
 * @desc    Change user status (active/inactive)
 * @route   PATCH /api/users/:id/status
 * @access  Admin
 */
const updateStatus = catchAsync(async (req, res) => {
  const user = await userService.updateStatus(req.params.id, req.body.status, req.user._id);
  ApiResponse.success(res, 'User status updated successfully', user);
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  ApiResponse.success(res, 'User deleted successfully');
});

module.exports = { getUsers, getUserById, updateUser, updateRole, updateStatus, deleteUser };
