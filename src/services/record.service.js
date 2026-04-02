const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');

/**
 * Build a MongoDB filter object from query parameters.
 * This is a filter builder pattern — keeps query construction clean and testable.
 */
const buildFilter = ({ type, category, startDate, endDate, search }) => {
  const filter = { isDeleted: false };

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    filter.description = { $regex: search, $options: 'i' };
  }

  return filter;
};

/**
 * Create a new financial record.
 */
const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({
    ...data,
    createdBy: userId,
  });
  return record;
};

/**
 * Get records with filtering, sorting, and pagination.
 */
const getRecords = async (query) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'date',
    order = 'desc',
    ...filterParams
  } = query;

  const filter = buildFilter(filterParams);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [docs, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    FinancialRecord.countDocuments(filter),
  ]);

  return { docs, total, page, limit };
};

/**
 * Get a single record by ID.
 */
const getRecordById = async (recordId) => {
  const record = await FinancialRecord.findOne({
    _id: recordId,
    isDeleted: false,
  }).populate('createdBy', 'name email');

  if (!record) throw ApiError.notFound('Financial record');
  return record;
};

/**
 * Update a record.
 */
const updateRecord = async (recordId, updateData, userId) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    { ...updateData, updatedBy: userId },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  if (!record) throw ApiError.notFound('Financial record');
  return record;
};

/**
 * Soft-delete a record.
 * Sets isDeleted flag and records who deleted it and when.
 */
const deleteRecord = async (recordId, userId) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    },
    { new: true }
  );

  if (!record) throw ApiError.notFound('Financial record');
  return { message: 'Record deleted successfully' };
};

/**
 * Restore a soft-deleted record (admin only).
 */
const restoreRecord = async (recordId) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: recordId, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true }
  ).setOptions({ includeDeleted: true });

  if (!record) throw ApiError.notFound('Deleted record');
  return record;
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  restoreRecord,
};
