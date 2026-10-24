import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Phase 5: QR Identity, Table Codes, Order Links & Customer Entry', () => {
  const app = createApp();
  let managerTokenRest1: string;
  let managerTokenRest2: string;

  beforeAll(async () => {
    // Login Manager for Restaurant 1 (Osteria Della Spina)
    const res1 = await request(app).post('/api/v1/auth/login').send({
      email: 'elena.manager@osteriaspina.demo',
      password: 'PlateProof2026!Demo',
    });
    managerTokenRest1 = res1.body.data.token;

    // Login Manager in Restaurant 2 (Trattoria Al Sole)
    const res2 = await request(app).post('/api/v1/auth/login').send({
      email: 'gianluigi.manager@trattoriaalsole.demo',
      password: 'PlateProof2026!Demo',
    });
    managerTokenRest2 = res2.body.data.token;
  });

  it('should resolve a valid Table QR token to restaurant profile and menu deep-link', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/tbl_osteria_t04');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('table');
    expect(res.body.data.tableNumber).toBe('Table 04');
    expect(res.body.data.restaurant.name).toBe('Osteria Della Spina');
    expect(res.body.data.redirectPath).toContain('/menu?table=Table%2004');
  });

  it('should resolve a valid Order QR token with dishes, allergen matrix, and CCP safety logs', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/ord_token_7294');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('order');
    expect(res.body.data.order.orderReference).toBe('ORD-7294');
    expect(res.body.data.order.tableNumber).toBe('Table 04');
    expect(res.body.data.order.status).toBe('served');

    // Verify ordered dishes
    expect(res.body.data.order.items.length).toBeGreaterThan(0);
    const pastaItem = res.body.data.order.items.find(
      (i: any) => i.name === 'Truffle Tagliolini al Burro'
    );
    expect(pastaItem).toBeDefined();
    expect(pastaItem.allergens.some((a: any) => a.allergen_code === 'gluten')).toBe(true);

    // Verify verified HACCP temperature records
    expect(res.body.data.order.safetyChecks.length).toBeGreaterThan(0);
    const cookCheck = res.body.data.order.safetyChecks.find(
      (c: any) => c.check_type === 'CCP-2 Internal Core Cook Temperature'
    );
    expect(cookCheck).toBeDefined();
    expect(cookCheck.reading_or_status).toBe('85.4°C');
    expect(cookCheck.is_safe).toBe(true);
  });

  it('should never expose customer personal data (PII) in QR order transparency responses', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/ord_token_7294');

    expect(res.status).toBe(200);
    const responseText = JSON.stringify(res.body);

    // Verify zero PII is included
    expect(responseText).not.toContain('customer_name');
    expect(responseText).not.toContain('customer_phone');
    expect(responseText).not.toContain('customer_email');
    expect(responseText).not.toContain('credit_card');
    expect(responseText).not.toContain('payment_method');
  });

  it('should prevent arbitrary order scraping: direct ID lookup without token requires authentication', async () => {
    // Unauthenticated request to inspect private order
    const res = await request(app).get('/api/v1/orders/ord-demo-01');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should block cross-tenant staff from querying another restaurant private order', async () => {
    // Sophia logged into Restaurant 2 attempts to query Restaurant 1's private order
    const res = await request(app)
      .get('/api/v1/orders/ord-demo-01')
      .set('Authorization', `Bearer ${managerTokenRest2}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  it('should fail safely on expired QR tokens with 401 TOKEN_EXPIRED', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/ord_token_expired');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('should fail safely on revoked QR tokens with 403 TOKEN_REVOKED', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/ord_token_revoked');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_REVOKED');
  });

  it('should fail safely on invalid or tampered QR tokens with 404 TOKEN_INVALID', async () => {
    const res = await request(app).get('/api/v1/qr/resolve/tampered-hacked-token-999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('should allow authorized restaurant manager to generate a printable table QR code with visual assets', async () => {
    const res = await request(app)
      .post('/api/v1/qr/restaurants/aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa/tables/generate')
      .set('Authorization', `Bearer ${managerTokenRest1}`)
      .send({
        tableNumber: 'Table 25 - Garden Terrace',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tableNumber).toBe('Table 25 - Garden Terrace');
    expect(res.body.data.rawToken).toBeDefined();
    expect(res.body.data.qrDataUrl).toContain('data:image/png;base64,');
    expect(res.body.data.qrSvg).toContain('<svg');
    expect(res.body.data.printableStationCardHtml).toContain('Table 25 - Garden Terrace');

    // Verify the generated token resolves immediately for customers!
    const resolveRes = await request(app).get(`/api/v1/qr/resolve/${res.body.data.rawToken}`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.tableNumber).toBe('Table 25 - Garden Terrace');
  });

  it('should allow manager to revoke a table QR code and block subsequent customer resolution', async () => {
    // Revoke Table 04 QR code
    const res = await request(app)
      .post('/api/v1/qr/restaurants/aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa/revoke/qr-tbl-01')
      .set('Authorization', `Bearer ${managerTokenRest1}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify Table 04 is now rejected with TOKEN_REVOKED
    const resolveRes = await request(app).get('/api/v1/qr/resolve/tbl_osteria_t04');
    expect(resolveRes.status).toBe(403);
    expect(resolveRes.body.error.code).toBe('TOKEN_REVOKED');
  });

  it('should prevent cross-tenant manager from revoking another restaurant QR code', async () => {
    // Sophia in Restaurant 2 attempts to revoke Restaurant 1's QR code
    const res = await request(app)
      .post('/api/v1/qr/restaurants/aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa/revoke/qr-tbl-02')
      .set('Authorization', `Bearer ${managerTokenRest2}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
