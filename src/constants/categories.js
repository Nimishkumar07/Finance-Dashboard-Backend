/**
 * Predefined categories for financial records.
 * Used for validation and aggregation grouping.
 */
const RECORD_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

const CATEGORIES = Object.freeze({
  // Income categories
  SALARY: 'salary',
  FREELANCE: 'freelance',
  INVESTMENTS: 'investments',
  RENTAL: 'rental',
  OTHER_INCOME: 'other_income',

  // Expense categories
  FOOD: 'food',
  TRANSPORT: 'transport',
  UTILITIES: 'utilities',
  ENTERTAINMENT: 'entertainment',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  SHOPPING: 'shopping',
  RENT: 'rent',
  INSURANCE: 'insurance',
  OTHER_EXPENSE: 'other_expense',
});

const INCOME_CATEGORIES = [
  CATEGORIES.SALARY,
  CATEGORIES.FREELANCE,
  CATEGORIES.INVESTMENTS,
  CATEGORIES.RENTAL,
  CATEGORIES.OTHER_INCOME,
];

const EXPENSE_CATEGORIES = [
  CATEGORIES.FOOD,
  CATEGORIES.TRANSPORT,
  CATEGORIES.UTILITIES,
  CATEGORIES.ENTERTAINMENT,
  CATEGORIES.HEALTHCARE,
  CATEGORIES.EDUCATION,
  CATEGORIES.SHOPPING,
  CATEGORIES.RENT,
  CATEGORIES.INSURANCE,
  CATEGORIES.OTHER_EXPENSE,
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const ALL_RECORD_TYPES = Object.values(RECORD_TYPES);

module.exports = {
  RECORD_TYPES,
  CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
  ALL_RECORD_TYPES,
};
