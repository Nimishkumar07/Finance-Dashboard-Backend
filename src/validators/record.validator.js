const Joi = require('joi');
const { ALL_RECORD_TYPES, ALL_CATEGORIES } = require('../constants/categories');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required',
    }),
  type: Joi.string().valid(...ALL_RECORD_TYPES).required()
    .messages({
      'any.only': `Type must be one of: ${ALL_RECORD_TYPES.join(', ')}`,
      'any.required': 'Type is required',
    }),
  category: Joi.string().valid(...ALL_CATEGORIES).required()
    .messages({
      'any.only': 'Invalid category',
      'any.required': 'Category is required',
    }),
  date: Joi.date().iso().max('now').required()
    .messages({
      'date.max': 'Date cannot be in the future',
      'any.required': 'Date is required',
    }),
  description: Joi.string().trim().max(500).allow('').default(''),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid(...ALL_RECORD_TYPES),
  category: Joi.string().valid(...ALL_CATEGORIES),
  date: Joi.date().iso().max('now'),
  description: Joi.string().trim().max(500).allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const recordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid(...ALL_RECORD_TYPES),
  category: Joi.string().valid(...ALL_CATEGORIES),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  search: Joi.string().trim().max(100),
  sortBy: Joi.string().valid('date', 'amount', 'createdAt').default('date'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createRecordSchema, updateRecordSchema, recordQuerySchema };
