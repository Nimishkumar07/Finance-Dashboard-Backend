const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/permissions');
const {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
} = require('../validators/record.validator');

/**
 * @swagger
 * tags:
 *   name: Financial Records
 *   description: Financial record management with filtering and soft delete
 */

// All record routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Financial Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: income
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               description:
 *                 type: string
 *                 example: Monthly salary for March
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  authorize(PERMISSIONS.CREATE_RECORD),
  validate(createRecordSchema),
  recordController.createRecord
);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all records (paginated, filterable)
 *     tags: [Financial Records]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in descriptions
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, createdAt]
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Records with pagination metadata
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  authorize(PERMISSIONS.VIEW_RECORDS),
  validate(recordQuerySchema, 'query'),
  recordController.getRecords
);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single record by ID
 *     tags: [Financial Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get('/:id', authorize(PERMISSIONS.VIEW_RECORDS), recordController.getRecordById);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update a financial record
 *     tags: [Financial Records]
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.put(
  '/:id',
  authorize(PERMISSIONS.UPDATE_RECORD),
  validate(updateRecordSchema),
  recordController.updateRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft delete a financial record
 *     tags: [Financial Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record soft deleted
 *       404:
 *         description: Record not found
 */
router.delete('/:id', authorize(PERMISSIONS.DELETE_RECORD), recordController.deleteRecord);

/**
 * @swagger
 * /api/records/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted record
 *     tags: [Financial Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record restored
 *       404:
 *         description: Deleted record not found
 */
router.patch(
  '/:id/restore',
  authorize(PERMISSIONS.DELETE_RECORD),
  recordController.restoreRecord
);

module.exports = router;
