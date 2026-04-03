const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get financial summary (total income, expenses, balance)
 * @route   GET /api/dashboard/summary
 * @access  Viewer, Analyst, Admin
 */
const getSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const summary = await dashboardService.getSummary(startDate, endDate);
  ApiResponse.success(res, 'Financial summary retrieved', summary);
});

/**
 * @desc    Get category-wise breakdown
 * @route   GET /api/dashboard/category-breakdown
 * @access  Analyst, Admin
 */
const getCategoryBreakdown = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const breakdown = await dashboardService.getCategoryBreakdown(startDate, endDate);
  ApiResponse.success(res, 'Category breakdown retrieved', breakdown);
});

/**
 * @desc    Get monthly income/expense trends
 * @route   GET /api/dashboard/trends
 * @access  Analyst, Admin
 */
const getMonthlyTrends = catchAsync(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const trends = await dashboardService.getMonthlyTrends(months);
  ApiResponse.success(res, 'Monthly trends retrieved', trends);
});

/**
 * @desc    Get recent financial activity
 * @route   GET /api/dashboard/recent-activity
 * @access  Viewer, Analyst, Admin
 */
const getRecentActivity = catchAsync(async (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const activity = await dashboardService.getRecentActivity(count);
  ApiResponse.success(res, 'Recent activity retrieved', activity);
});

/**
 * @desc    Get daily income/expense breakdown
 * @route   GET /api/dashboard/daily-breakdown
 * @access  Analyst, Admin
 */
const getDailyBreakdown = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const breakdown = await dashboardService.getDailyBreakdown(startDate, endDate);
  ApiResponse.success(res, 'Daily breakdown retrieved', breakdown);
});

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getDailyBreakdown,
};
