import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Phase 3: Authentication, RBAC, Multi-Tenant Scoping & Dual-Control', () => {
  const app = createApp();

  const r1Id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const r2Id = 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  // 1. Unauthenticated Access
  it('should reject unauthenticated access to private restaurant records with 401', async () => {
    const res = await request(app).get(`/api/v1/restaurants/${r1Id}/private-records`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // 2. Safe Error Handling on Login
  it('should return safe error without stack traces on invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error).not.toHaveProperty('stack');
  });

  // 3. Successful Login
  it('should authenticate user and return token with restaurant memberships', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('elena.manager@osteriaspina.demo');
    expect(res.body.data.user.memberships.length).toBeGreaterThan(0);
  });

  // 4. Cross-Tenant Access Rejection
  it('should block user from accessing another restaurant by changing ID in URL (Tenant Isolation)', async () => {
    // Elena belongs to Restaurant 1, NOT Restaurant 2
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    // Elena accesses Restaurant 1 -> OK
    const okRes = await request(app)
      .get(`/api/v1/restaurants/${r1Id}/private-records`)
      .set('Authorization', `Bearer ${token}`);
    expect(okRes.status).toBe(200);
    expect(okRes.body.success).toBe(true);

    // Elena accesses Restaurant 2 -> FORBIDDEN (Cross-tenant blocked)
    const blockedRes = await request(app)
      .get(`/api/v1/restaurants/${r2Id}/private-records`)
      .set('Authorization', `Bearer ${token}`);
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // 5. Legitimate Multi-Restaurant Access
  it('should permit access for multi-tenant user belonging to both restaurants with distinct roles', async () => {
    // Sophia has memberships in both Restaurant 1 and Restaurant 2
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sophia.multi@culinarygroup.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    // Sophia accesses Restaurant 1
    const res1 = await request(app)
      .get(`/api/v1/restaurants/${r1Id}/private-records`)
      .set('Authorization', `Bearer ${token}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.accessContext.role).toBe('restaurant_manager');

    // Sophia accesses Restaurant 2
    const res2 = await request(app)
      .get(`/api/v1/restaurants/${r2Id}/private-records`)
      .set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.accessContext.role).toBe('kitchen_staff');
  });

  // 6. Anti-Privilege Escalation: Self-assigning Supervisor / Platform Admin
  it('should block users from granting themselves platform_admin or supervisor roles on registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'malicious.attacker@example.com',
        password: 'securePassword123!',
        fullName: 'Attacker Attempting Escalation',
        requestedRole: 'platform_admin',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PRIVILEGE_ESCALATION_DENIED');
  });

  // 7. Anti-Privilege Escalation: Restaurant Self-Verification
  it('should prevent a restaurant account from marking itself officially verified', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/v1/restaurants/${r1Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_verified: true });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SELF_VERIFICATION_PROHIBITED');
  });

  // 8. Platform Admin Verification Authority
  it('should allow Platform Admin to officially verify a restaurant', async () => {
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@plateproof360.internal', password: 'PlateProof2026!Demo' });
    const adminToken = adminLogin.body.data.token;

    const res = await request(app)
      .post(`/api/v1/restaurants/${r2Id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.restaurant.is_verified).toBe(true);
  });

  // 9. Dual-Control Corrective Action Verification Rule
  it('should enforce Dual-Control: supervisor cannot verify an action they performed themselves', async () => {
    // 1. Login as Leo (kitchen staff) and Marco (supervisor)
    const leoLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'leo.cook@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const leoToken = leoLogin.body.data.token;

    const marcoLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'marco.supervisor@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const marcoToken = marcoLogin.body.data.token;

    // 2. Create incident and action
    const incidentRes = await request(app)
      .post(`/api/v1/operations/${r1Id}/incidents`)
      .set('Authorization', `Bearer ${marcoToken}`)
      .send({
        title: 'Walk-In Chiller Temp Spike',
        severity: 'high',
        correctiveActionDescription: 'Inspect defrost timer and reset compressor breaker',
      });
    expect(incidentRes.status).toBe(201);
    const actionId = incidentRes.body.data.correctiveAction.id;

    // 3. Marco performs the action
    await request(app)
      .post(`/api/v1/operations/actions/${actionId}/perform`)
      .set('Authorization', `Bearer ${marcoToken}`)
      .send({ evidenceNotes: 'I reset the circuit breaker myself.' });

    // 4. Marco tries to verify the action he performed -> MUST BE REJECTED BY DUAL-CONTROL RULE!
    const selfVerifyRes = await request(app)
      .post(`/api/v1/operations/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${marcoToken}`)
      .send({ decision: 'approved', comments: 'Looks good' });
    expect(selfVerifyRes.status).toBe(403);
    expect(selfVerifyRes.body.error.code).toBe('DUAL_CONTROL_VIOLATION');

    // 5. Elena (Manager / Alternate supervisor) verifies Marco's action -> PERMITTED!
    const elenaLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const elenaToken = elenaLogin.body.data.token;

    const validVerifyRes = await request(app)
      .post(`/api/v1/operations/actions/${actionId}/verify`)
      .set('Authorization', `Bearer ${elenaToken}`)
      .send({ decision: 'approved', comments: 'Verified independently by Elena' });
    expect(validVerifyRes.status).toBe(200);
    expect(validVerifyRes.body.data.correctiveAction.status).toBe('verified_closed');
  });
});
