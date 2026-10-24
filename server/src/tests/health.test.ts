import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('API Health and Diagnostics Endpoints', () => {
  const app = createApp();

  it('GET / should return online status banner', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'PlateProof 360 API');
    expect(res.body).toHaveProperty('status', 'online');
  });

  it('GET /api/v1/ping should return pong', async () => {
    const res = await request(app).get('/api/v1/ping');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pong).toBe(true);
  });

  it('GET /api/v1/health should return structured health response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('service', 'PlateProof 360 REST API');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('status');
  });

  it('GET non-existent endpoint should return 404 with standard format', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
