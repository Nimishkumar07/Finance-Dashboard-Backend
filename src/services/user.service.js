const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

/**
 * Get all users with filtering, search, and pagination.
 */
const getUsers = async ({ page = 1, limit = 10, role, status, search }) => {
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { docs, total, page, limit };
};

/**
 * Get a single user by ID.
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');
  return user;
};

/**
 * Update user details (name, email).
 */
const updateUser = async (userId, updateData) => {
  // Check email uniqueness if email is being changed
  if (updateData.email) {
    const existing = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Email is already in use');
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User');
  return user;
};

/**
 * Change a user's role.
 * Business rules:
 * - Cannot change your own role (prevents accidental self-demotion)
 * - Cannot demote the last admin
 */
const updateRole = async (userId, role, requestingUserId) => {
  if (userId === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  // Prevent removing the last admin
  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN, status: 'active' });
    if (adminCount <= 1) {
      throw ApiError.badRequest('Cannot demote the last active admin');
    }
  }

  user.role = role;
  await user.save();
  return user;
};

/**
 * Activate or deactivate a user.
 * Business rules:
 * - Cannot deactivate yourself
 * - Cannot deactivate the last active admin
 */
const updateStatus = async (userId, status, requestingUserId) => {
  if (userId === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot change your own status');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  // Prevent deactivating the last admin
  if (user.role === ROLES.ADMIN && status === 'inactive') {
    const activeAdminCount = await User.countDocuments({
      role: ROLES.ADMIN,
      status: 'active',
    });
    if (activeAdminCount <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active admin');
    }
  }

  user.status = status;
  await user.save();
  return user;
};

/**
 * Delete a user permanently.
 * Business rules:
 * - Cannot delete yourself
 * - Cannot delete the last admin
 * - Reassigns (or orphans) their financial records
 */
const deleteUser = async (userId, requestingUserId) => {
  if (userId === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      throw ApiError.badRequest('Cannot delete the last admin');
    }
  }

  // Soft-delete all records created by this user instead of orphaning them
  await FinancialRecord.updateMany(
    { createdBy: userId },
    { isDeleted: true, deletedAt: new Date(), deletedBy: requestingUserId }
  );

  await User.findByIdAndDelete(userId);
  return { message: 'User deleted successfully' };
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateRole,
  updateStatus,
  deleteUser,
};
