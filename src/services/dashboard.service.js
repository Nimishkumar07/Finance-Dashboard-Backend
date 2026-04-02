const FinancialRecord = require('../models/FinancialRecord');

/**
 * Dashboard Service — MongoDB Aggregation Pipelines.
 *
 * This is where the real backend engineering lives.
 * Each method runs a specialized aggregation pipeline for different dashboard views.
 */

/**
 * Base match stage: exclude soft-deleted records.
 * Optionally filter by date range.
 */
const baseMatch = (startDate, endDate) => {
  const match = { isDeleted: false };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  return match;
};

/**
 * Financial Summary — Total income, total expenses, net balance, record count.
 * Single aggregation pipeline that computes everything in one DB round-trip.
 */
const getSummary = async (startDate, endDate) => {
  const result = await FinancialRecord.aggregate([
    { $match: baseMatch(startDate, endDate) },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        totalRecords: { $sum: 1 },
        avgTransactionAmount: { $avg: '$amount' },
        maxTransaction: { $max: '$amount' },
        minTransaction: { $min: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: { $round: ['$totalIncome', 2] },
        totalExpenses: { $round: ['$totalExpenses', 2] },
        netBalance: {
          $round: [{ $subtract: ['$totalIncome', '$totalExpenses'] }, 2],
        },
        totalRecords: 1,
        avgTransactionAmount: { $round: ['$avgTransactionAmount', 2] },
        maxTransaction: { $round: ['$maxTransaction', 2] },
        minTransaction: { $round: ['$minTransaction', 2] },
      },
    },
  ]);

  return (
    result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      totalRecords: 0,
      avgTransactionAmount: 0,
      maxTransaction: 0,
      minTransaction: 0,
    }
  );
};

/**
 * Category Breakdown — Income and expense totals grouped by category.
 * Returns separate arrays for income and expense categories.
 */
const getCategoryBreakdown = async (startDate, endDate) => {
  const result = await FinancialRecord.aggregate([
    { $match: baseMatch(startDate, endDate) },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id.type',
        category: '$_id.category',
        total: { $round: ['$total', 2] },
        count: 1,
        avgAmount: { $round: ['$avgAmount', 2] },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Separate into income and expense groups
  const income = result.filter((r) => r.type === 'income');
  const expense = result.filter((r) => r.type === 'expense');

  return { income, expense };
};

/**
 * Monthly Trends — Income and expense totals per month.
 * Uses $dateToString for month grouping  — perfect for line charts.
 */
const getMonthlyTrends = async (months = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        data: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        label: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        income: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$data',
                        cond: { $eq: ['$$this.type', 'income'] },
                      },
                    },
                    in: '$$this.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        expense: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$data',
                        cond: { $eq: ['$$this.type', 'expense'] },
                      },
                    },
                    in: '$$this.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        totalTransactions: {
          $sum: {
            $map: { input: '$data', in: '$$this.count' },
          },
        },
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  return result;
};

/**
 * Recent Activity — Last N financial records with creator details.
 * Lightweight query for dashboard "recent transactions" widget.
 */
const getRecentActivity = async (count = 10) => {
  const records = await FinancialRecord.find({ isDeleted: false })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(count);

  return records;
};

/**
 * Income vs Expense Comparison — Daily breakdown for a date range.
 * Useful for bar chart comparisons.
 */
const getDailyBreakdown = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    // Default: last 30 days
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        data: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        income: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$data',
                        cond: { $eq: ['$$this.type', 'income'] },
                      },
                    },
                    in: '$$this.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        expense: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$data',
                        cond: { $eq: ['$$this.type', 'expense'] },
                      },
                    },
                    in: '$$this.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  return result;
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getDailyBreakdown,
};
