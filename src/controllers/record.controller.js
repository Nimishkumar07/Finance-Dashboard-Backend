const recordService = require('../services/record.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new financial record
 * @route   POST /api/records
 * @access  Admin
 */
const createRecord = catchAsync(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user._id);
  ApiResponse.created(res, 'Financial record created successfully', record);
});

/**
 * @desc    Get all records (paginated, filterable, searchable)
 * @route   GET /api/records
 * @access  Analyst, Admin
 */
const getRecords = catchAsync(async (req, res) => {
  const result = await recordService.getRecords(req.query);
  ApiResponse.paginated(res, 'Records retrieved successfully', result);
});

/**
 * @desc    Get single record by ID
 * @route   GET /api/records/:id
 * @access  Analyst, Admin
 */
const getRecordById = catchAsync(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  ApiResponse.success(res, 'Record retrieved successfully', record);
});

/**
 * @desc    Update a financial record
 * @route   PUT /api/records/:id
 * @access  Admin
 */
const updateRecord = catchAsync(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.body, req.user._id);
  ApiResponse.success(res, 'Record updated successfully', record);
});

/**
 * @desc    Soft delete a financial record
 * @route   DELETE /api/records/:id
 * @access  Admin
 */
const deleteRecord = catchAsync(async (req, res) => {
  await recordService.deleteRecord(req.params.id, req.user._id);
  ApiResponse.success(res, 'Record deleted successfully');
});

/**
 * @desc    Restore a soft-deleted financial record
 * @route   PATCH /api/records/:id/restore
 * @access  Admin
 */
const restoreRecord = catchAsync(async (req, res) => {
  const record = await recordService.restoreRecord(req.params.id);
  ApiResponse.success(res, 'Record restored successfully', record);
});

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  restoreRecord,
};
