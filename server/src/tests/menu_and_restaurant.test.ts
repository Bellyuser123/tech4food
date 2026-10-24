import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Phase 4: Restaurant Profiles, Menu Management & Structured Allergens', () => {
  const app = createApp();

  const r1Id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const r2Id = 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  // 1. Public Profile Endpoint
  it('GET /api/v1/restaurants/:restaurantId/public should return public fields without operator private data', async () => {
    const res = await request(app).get(`/api/v1/restaurants/${r1Id}/public`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.name).toBe('Osteria Della Spina');
    expect(data.address).toContain('Corso Venezia');
    expect(data).toHaveProperty('branches');
    expect(data).toHaveProperty('verification');
    expect(data.verification).toHaveProperty('isVerified', true);
    expect(data.verification).toHaveProperty('disclaimer');

    // Ensure private operator fields are STRIPPED
    expect(data).not.toHaveProperty('owner_contact_email');
    expect(data).not.toHaveProperty('tax_identifier');
    expect(data).not.toHaveProperty('operatorPrivateInfo');
  });

  // 2. Full Manager Profile with Scoping
  it('GET /api/v1/restaurants/:restaurantId should return private operator details for authorized manager', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get(`/api/v1/restaurants/${r1Id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('operatorPrivateInfo');
    expect(res.body.data.operatorPrivateInfo.ownerFullName).toBe('Elena Rossi');
  });

  // 3. Cross-Tenant Rejection on Manager Profile
  it('should block manager from accessing full private profile of another restaurant', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get(`/api/v1/restaurants/${r2Id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // 4. Public Menu Retrieval (No Auth Required)
  it('GET /api/v1/restaurants/:restaurantId/menus should return menu categories, items and allergy caution notice without auth', async () => {
    const res = await request(app).get(`/api/v1/restaurants/${r1Id}/menus`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('allergyCautionNotice');
    expect(data.allergyCautionNotice).toContain('cross-contact can occur');
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);

    // Verify structured allergen distinction:
    // Truffle Tagliolini has verified allergens
    const tagliolini = data.items.find((i: { name: string }) => i.name.includes('Tagliolini'));
    expect(tagliolini).toBeDefined();
    expect(tagliolini.has_unverified_allergens).toBe(false);

    // Harbor Market Catch Stew has 'not_provided' allergens -> has_unverified_allergens = true!
    const stew = data.items.find((i: { name: string }) => i.name.includes('Catch Stew'));
    expect(stew).toBeDefined();
    expect(stew.has_unverified_allergens).toBe(true);
  });

  // 5. Manager Creates New Menu Item with Structured Allergens
  it('should allow authorized manager to create a menu item with structured allergens', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const newItemPayload = {
      categoryId: 'cat-3',
      name: 'Charred Heritage Polenta Cake',
      description: 'Crispy rosemary polenta with wild mushroom ragù',
      price: 16.5,
      dietaryTags: ['Vegan', 'Gluten-Free'],
      ingredients: ['Cornmeal', 'Rosemary', 'Porcini Mushrooms', 'Olive Oil'],
      allergens: [
        { allergen_code: 'gluten', status: 'free_from' },
        { allergen_code: 'dairy', status: 'free_from' },
        { allergen_code: 'peanuts', status: 'free_from' },
      ],
    };

    const res = await request(app)
      .post(`/api/v1/restaurants/${r1Id}/menus/items`)
      .set('Authorization', `Bearer ${token}`)
      .send(newItemPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Charred Heritage Polenta Cake');
    expect(res.body.data.has_unverified_allergens).toBe(false);
  });

  // 6. Cross-Tenant Rejection on Menu Item Creation
  it('should block manager from creating menu items in another restaurant', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post(`/api/v1/restaurants/${r2Id}/menus/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: 'cat-1',
        name: 'Unauthorized Dish',
        price: 20,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // 7. Toggle Item Availability
  it('should allow supervisor/manager to toggle menu item availability', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/v1/restaurants/${r1Id}/menus/items/item-01/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_available: false });

    expect(res.status).toBe(200);
    expect(res.body.data.is_available).toBe(false);

    // Toggle back to true
    const resBack = await request(app)
      .patch(`/api/v1/restaurants/${r1Id}/menus/items/item-01/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_available: true });

    expect(resBack.status).toBe(200);
    expect(resBack.body.data.is_available).toBe(true);
  });

  // 8. Image Upload Endpoint
  it('POST /api/v1/uploads should accept base64 image data and return storage metadata', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'elena.manager@osteriaspina.demo', password: 'PlateProof2026!Demo' });
    const token = loginRes.body.data.token;

    // Small 1x1 transparent PNG base64
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${token}`)
      .send({ base64Image: tinyPng, fileName: 'test_dish.png' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('url');
    expect(res.body.data.url).toContain('/uploads/');
    expect(res.body.data.mimeType).toBe('image/png');
  });
});
