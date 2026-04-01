const mongoose = require('mongoose');
const { ALL_RECORD_TYPES } = require('../constants/categories');
const { ALL_CATEGORIES } = require('../constants/categories');

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ALL_RECORD_TYPES,
        message: 'Type must be either income or expense',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ALL_CATEGORIES,
        message: 'Invalid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    // Audit fields — track who created/modified the record
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ----- Indexes for query performance -----
financialRecordSchema.index({ type: 1, isDeleted: 1 });
financialRecordSchema.index({ category: 1, isDeleted: 1 });
financialRecordSchema.index({ date: -1, isDeleted: 1 });
financialRecordSchema.index({ createdBy: 1 });
// Compound index for common dashboard aggregation filter
financialRecordSchema.index({ isDeleted: 1, type: 1, date: -1 });

// ----- Query middleware: auto-exclude soft-deleted records -----
financialRecordSchema.pre(/^find/, function (next) {
  // Allow explicit queries for deleted records via { includeDeleted: true }
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = FinancialRecord;
