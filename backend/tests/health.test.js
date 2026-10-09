import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

process.env.DATABASE_URL = 'mongodb://localhost:27017/mailpilot_test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';

// Mock the db module
vi.mock('../src/db.js', () => ({
  checkDatabaseConnection: vi.fn(),
}));

describe('GET /api/v1/health', () => {
  let app;
  let dbMock;

  beforeEach(async () => {
    vi.resetModules();
    // Re-import the mocked module and the app
    dbMock = await import('../src/db.js');
    const appModule = await import('../src/app.js');
    app = appModule.default;
  });

  it('returns 200 and database connected when DB check succeeds', async () => {
    dbMock.checkDatabaseConnection.mockResolvedValue(true);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('returns 503 and database disconnected when DB check fails', async () => {
    dbMock.checkDatabaseConnection.mockResolvedValue(false);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.database).toBe('disconnected');
    expect(res.body.data.timestamp).toBeDefined();
  });
});
