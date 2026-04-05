const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary endpoints (aggregation pipelines)
 */

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get financial summary (income, expenses, balance, stats)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-15"
 *         description: Filter start date (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-04-05"
 *         description: Filter end date (optional)
 *     responses:
 *       200:
 *         description: Financial summary with totals, net balance, and statistics
 */
router.get(
  '/summary',
  authorize(PERMISSIONS.VIEW_DASHBOARD_SUMMARY),
  dashboardController.getSummary
);

/**
 * @swagger
 * /api/dashboard/category-breakdown:
 *   get:
 *     summary: Get income and expense breakdown by category
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-15"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-04-05"
 *     responses:
 *       200:
 *         description: Category breakdown with totals and averages
 */
router.get(
  '/category-breakdown',
  authorize(PERMISSIONS.VIEW_DASHBOARD_ANALYTICS),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly trend data with income, expense, and labels
 */
router.get(
  '/trends',
  authorize(PERMISSIONS.VIEW_DASHBOARD_ANALYTICS),
  dashboardController.getMonthlyTrends
);

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent financial activity
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent records to return
 *     responses:
 *       200:
 *         description: List of recent financial records
 */
router.get(
  '/recent-activity',
  authorize(PERMISSIONS.VIEW_DASHBOARD_SUMMARY),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /api/dashboard/daily-breakdown:
 *   get:
 *     summary: Get daily income/expense breakdown
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-15"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-04-05"
 *     responses:
 *       200:
 *         description: Daily breakdown of income vs expense
 */
router.get(
  '/daily-breakdown',
  authorize(PERMISSIONS.VIEW_DASHBOARD_ANALYTICS),
  dashboardController.getDailyBreakdown
);

module.exports = router;
