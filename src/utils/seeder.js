/**
 * Database Seeder
 *
 * Creates demo users and realistic sample financial records.
 * Run: npm run seed
 *
 * Demo Accounts:
 *   Admin   → admin@finance.com    / admin123
 *   Analyst → analyst@finance.com  / analyst123
 *   Viewer  → viewer@finance.com   / viewer123
 */

const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@finance.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    status: 'active',
  },
  {
    name: 'Analyst User',
    email: 'analyst@finance.com',
    password: 'analyst123',
    role: 'analyst',
    status: 'active',
  },
  {
    name: 'Viewer User',
    email: 'viewer@finance.com',
    password: 'viewer123',
    role: 'viewer',
    status: 'active',
  },
];

/**
 * Generate realistic financial records spanning the last 6 months.
 */
const generateRecords = (adminId) => {
  const records = [];
  const now = new Date();

  // Income records
  const incomeEntries = [
    { amount: 85000, category: 'salary', description: 'Monthly salary - January' },
    { amount: 85000, category: 'salary', description: 'Monthly salary - February' },
    { amount: 85000, category: 'salary', description: 'Monthly salary - March' },
    { amount: 85000, category: 'salary', description: 'Monthly salary - April' },
    { amount: 85000, category: 'salary', description: 'Monthly salary - May' },
    { amount: 85000, category: 'salary', description: 'Monthly salary - June' },
    { amount: 15000, category: 'freelance', description: 'Website redesign project' },
    { amount: 25000, category: 'freelance', description: 'Mobile app consultation' },
    { amount: 8000, category: 'freelance', description: 'Logo design for startup' },
    { amount: 12000, category: 'investments', description: 'Stock dividend - Q1' },
    { amount: 9500, category: 'investments', description: 'Mutual fund returns' },
    { amount: 18000, category: 'rental', description: 'Property rental income - Jan-Feb' },
    { amount: 18000, category: 'rental', description: 'Property rental income - Mar-Apr' },
    { amount: 18000, category: 'rental', description: 'Property rental income - May-Jun' },
    { amount: 5000, category: 'other_income', description: 'Cashback rewards' },
    { amount: 3500, category: 'other_income', description: 'Referral bonus' },
  ];

  // Expense records
  const expenseEntries = [
    { amount: 4500, category: 'food', description: 'Grocery shopping - Supermarket' },
    { amount: 3200, category: 'food', description: 'Restaurant meals and takeout' },
    { amount: 2800, category: 'food', description: 'Monthly grocery run' },
    { amount: 5500, category: 'food', description: 'Special dinner and celebrations' },
    { amount: 1500, category: 'food', description: 'Coffee and snacks' },
    { amount: 3000, category: 'transport', description: 'Monthly metro pass' },
    { amount: 8500, category: 'transport', description: 'Fuel and car maintenance' },
    { amount: 1200, category: 'transport', description: 'Uber/Ola rides' },
    { amount: 4000, category: 'utilities', description: 'Electricity bill' },
    { amount: 2500, category: 'utilities', description: 'Internet and phone bill' },
    { amount: 1800, category: 'utilities', description: 'Water and gas bill' },
    { amount: 3500, category: 'entertainment', description: 'Netflix, Spotify, and subscriptions' },
    { amount: 4200, category: 'entertainment', description: 'Movies and weekend outings' },
    { amount: 2000, category: 'entertainment', description: 'Gaming subscription' },
    { amount: 6000, category: 'healthcare', description: 'Annual health checkup' },
    { amount: 3500, category: 'healthcare', description: 'Dental treatment' },
    { amount: 1500, category: 'healthcare', description: 'Medicines and pharmacy' },
    { amount: 15000, category: 'education', description: 'Online course - System Design' },
    { amount: 8000, category: 'education', description: 'Technical books and resources' },
    { amount: 7500, category: 'shopping', description: 'New laptop accessories' },
    { amount: 12000, category: 'shopping', description: 'Clothing and footwear' },
    { amount: 4500, category: 'shopping', description: 'Home decor items' },
    { amount: 25000, category: 'rent', description: 'Monthly apartment rent' },
    { amount: 25000, category: 'rent', description: 'Monthly apartment rent' },
    { amount: 25000, category: 'rent', description: 'Monthly apartment rent' },
    { amount: 8000, category: 'insurance', description: 'Health insurance premium' },
    { amount: 5000, category: 'insurance', description: 'Vehicle insurance' },
    { amount: 2000, category: 'other_expense', description: 'Miscellaneous expenses' },
    { amount: 3500, category: 'other_expense', description: 'Gifts and donations' },
  ];

  // Distribute records across the last 6 months
  const createDate = (monthsAgo, day) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.min(day, 28)); // Safe day
    return date;
  };

  incomeEntries.forEach((entry, i) => {
    records.push({
      ...entry,
      type: 'income',
      date: createDate(i % 6, (i * 3 + 1) % 28 + 1),
      createdBy: adminId,
    });
  });

  expenseEntries.forEach((entry, i) => {
    records.push({
      ...entry,
      type: 'expense',
      date: createDate(i % 6, (i * 2 + 5) % 28 + 1),
      createdBy: adminId,
    });
  });

  return records;
};

const seed = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(config.mongo.uri);
    console.log('[Seeder] Connected.');

    // Clear existing data
    console.log('[Seeder] Clearing existing data...');
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});

    // Create users
    console.log('[Seeder] Creating users...');
    const users = await User.create(seedUsers);
    const admin = users.find((u) => u.role === 'admin');

    console.log('[Seeder] Users created:');
    users.forEach((u) => {
      console.log(`  - ${u.name} (${u.email}) → ${u.role}`);
    });

    // Create financial records
    console.log('[Seeder] Creating financial records...');
    const records = generateRecords(admin._id);
    await FinancialRecord.insertMany(records);
    console.log(`[Seeder] Created ${records.length} financial records.`);

    console.log('\n[Seeder] ✅ Database seeded successfully!');
    console.log('\n  Demo Accounts:');
    console.log('  ┌─────────┬──────────────────────┬────────────┐');
    console.log('  │ Role    │ Email                │ Password   │');
    console.log('  ├─────────┼──────────────────────┼────────────┤');
    console.log('  │ Admin   │ admin@finance.com    │ admin123   │');
    console.log('  │ Analyst │ analyst@finance.com  │ analyst123 │');
    console.log('  │ Viewer  │ viewer@finance.com   │ viewer123  │');
    console.log('  └─────────┴──────────────────────┴────────────┘');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
