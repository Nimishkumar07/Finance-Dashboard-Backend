const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const FinancialRecord = require('../src/models/FinancialRecord');

const request = supertest(app);

// Store tokens for reuse across tests
let adminToken, analystToken, viewerToken;
let adminId, analystId, viewerId;

beforeAll(async () => {
  // Connect to test database
  const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-dashboard-test';
  await mongoose.connect(testUri);

  // Clean database
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  // Create test users via API
  const adminRes = await request.post('/api/auth/register').send({
    name: 'Test Admin',
    email: 'testadmin@test.com',
    password: 'password123',
  });
  adminToken = adminRes.body.data.token;
  adminId = adminRes.body.data.user.id;

  // Manually set admin role (since register defaults to viewer)
  await User.findByIdAndUpdate(adminId, { role: 'admin' });

  const analystRes = await request.post('/api/auth/register').send({
    name: 'Test Analyst',
    email: 'testanalyst@test.com',
    password: 'password123',
  });
  analystToken = analystRes.body.data.token;
  analystId = analystRes.body.data.user.id;
  await User.findByIdAndUpdate(analystId, { role: 'analyst' });

  const viewerRes = await request.post('/api/auth/register').send({
    name: 'Test Viewer',
    email: 'testviewer@test.com',
    password: 'password123',
  });
  viewerToken = viewerRes.body.data.token;
  viewerId = viewerRes.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});
  await mongoose.connection.close();
});

// ==================== AUTH TESTS ====================
describe('Authentication', () => {
  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('newuser@test.com');
    expect(res.body.data.user.role).toBe('viewer'); // Default role
    expect(res.body.data.user.password).toBeUndefined(); // Should not expose
  });

  test('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'testadmin@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - should validate required fields', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'invalid',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login - should login with valid credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'testadmin@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    // Update admin token with fresh one
    adminToken = res.body.data.token;
  });

  test('POST /api/auth/login - should reject invalid password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'testadmin@test.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - should return current user', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('testadmin@test.com');
  });

  test('GET /api/auth/me - should reject without token', async () => {
    const res = await request.get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});

// ==================== RBAC TESTS ====================
describe('Role-Based Access Control', () => {
  let testRecordId;

  // Admin creates a record first
  beforeAll(async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'salary',
        date: '2024-03-15',
        description: 'Test record',
      });
    testRecordId = res.body.data.id;
  });

  test('Viewer CANNOT create records', async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 1000,
        type: 'expense',
        category: 'food',
        date: '2024-03-15',
      });

    expect(res.status).toBe(403);
  });

  test('Viewer CANNOT list records', async () => {
    const res = await request
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('Viewer CAN view dashboard summary', async () => {
    const res = await request
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });

  test('Viewer CANNOT view analytics', async () => {
    const res = await request
      .get('/api/dashboard/category-breakdown')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('Analyst CAN view records', async () => {
    const res = await request
      .get('/api/records')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
  });

  test('Analyst CANNOT create records', async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        amount: 1000,
        type: 'expense',
        category: 'food',
        date: '2024-03-15',
      });

    expect(res.status).toBe(403);
  });

  test('Analyst CAN view analytics', async () => {
    const res = await request
      .get('/api/dashboard/category-breakdown')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
  });

  test('Viewer CANNOT manage users', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('Admin CAN manage users', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

// ==================== RECORD TESTS ====================
describe('Financial Records', () => {
  let recordId;

  test('POST /api/records - should create a record', async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 15000,
        type: 'expense',
        category: 'rent',
        date: '2024-03-01',
        description: 'Monthly rent payment',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(15000);
    expect(res.body.data.type).toBe('expense');
    expect(res.body.data.category).toBe('rent');
    recordId = res.body.data.id;
  });

  test('POST /api/records - should reject invalid amount', async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -100,
        type: 'expense',
        category: 'food',
        date: '2024-03-15',
      });

    expect(res.status).toBe(400);
  });

  test('POST /api/records - should reject invalid type', async () => {
    const res = await request
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: 'invalid',
        category: 'food',
        date: '2024-03-15',
      });

    expect(res.status).toBe(400);
  });

  test('GET /api/records - should return paginated records', async () => {
    const res = await request
      .get('/api/records?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  test('GET /api/records - should filter by type', async () => {
    const res = await request
      .get('/api/records?type=expense')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((record) => {
      expect(record.type).toBe('expense');
    });
  });

  test('PUT /api/records/:id - should update a record', async () => {
    const res = await request
      .put(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 16000,
        description: 'Updated rent payment',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(16000);
  });

  test('DELETE /api/records/:id - should soft delete', async () => {
    const res = await request
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Should not appear in normal queries
    const getRes = await request
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  test('PATCH /api/records/:id/restore - should restore deleted record', async () => {
    const res = await request
      .patch(`/api/records/${recordId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(false);
  });
});

// ==================== DASHBOARD TESTS ====================
describe('Dashboard Analytics', () => {
  test('GET /api/dashboard/summary - should return financial summary', async () => {
    const res = await request
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data).toHaveProperty('netBalance');
    expect(res.body.data).toHaveProperty('totalRecords');
  });

  test('GET /api/dashboard/category-breakdown - should return breakdown', async () => {
    const res = await request
      .get('/api/dashboard/category-breakdown')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('income');
    expect(res.body.data).toHaveProperty('expense');
    expect(Array.isArray(res.body.data.income)).toBe(true);
    expect(Array.isArray(res.body.data.expense)).toBe(true);
  });

  test('GET /api/dashboard/trends - should return monthly trends', async () => {
    const res = await request
      .get('/api/dashboard/trends?months=6')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/dashboard/recent-activity - should return recent records', async () => {
    const res = await request
      .get('/api/dashboard/recent-activity?count=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  test('GET /api/dashboard/summary - should support date filtering', async () => {
    const res = await request
      .get('/api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
  });
});

// ==================== USER MANAGEMENT TESTS ====================
describe('User Management', () => {
  test('GET /api/users - should return paginated users', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('PATCH /api/users/:id/role - admin cannot change own role', async () => {
    const res = await request
      .patch(`/api/users/${adminId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'viewer' });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/users/:id/status - admin cannot deactivate self', async () => {
    const res = await request
      .patch(`/api/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(400);
  });
});

// ==================== ERROR HANDLING TESTS ====================
describe('Error Handling', () => {
  test('Should return 404 for unknown routes', async () => {
    const res = await request.get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Should return 400 for invalid ObjectId', async () => {
    const res = await request
      .get('/api/records/invalid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('Should return 401 for expired/invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
