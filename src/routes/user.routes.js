const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/permissions');
const {
  updateUserSchema,
  updateRoleSchema,
  updateStatusSchema,
  userQuerySchema,
} = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

// All user routes require authentication + admin permissions
router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, analyst, viewer]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users retrieved with pagination metadata
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  authorize(PERMISSIONS.VIEW_USERS),
  validate(userQuerySchema, 'query'),
  userController.getUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', authorize(PERMISSIONS.VIEW_USERS), userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user details (name, email)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id',
  authorize(PERMISSIONS.UPDATE_USER),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, analyst, viewer]
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Cannot change own role or last admin
 */
router.patch(
  '/:id/role',
  authorize(PERMISSIONS.MANAGE_ROLES),
  validate(updateRoleSchema),
  userController.updateRole
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Cannot deactivate self or last admin
 */
router.patch(
  '/:id/status',
  authorize(PERMISSIONS.UPDATE_USER),
  validate(updateStatusSchema),
  userController.updateStatus
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete self or last admin
 *       404:
 *         description: User not found
 */
router.delete('/:id', authorize(PERMISSIONS.DELETE_USER), userController.deleteUser);

module.exports = router;
