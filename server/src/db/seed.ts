import bcrypt from 'bcryptjs';
import { pool, checkDatabaseHealth } from './index.js';

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const health = await checkDatabaseHealth();
  if (health.status !== 'connected') {
    return {
      success: false,
      message: `Database not connected (${health.message}). Skipping database seed.`,
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Password Hashes (Demo passwords)
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('PlateProof2026!Demo', salt);

    // 2. Seed Users
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@plateproof360.internal',
        fullName: 'Platform Auditor Admin',
        isAdmin: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'elena.manager@osteriaspina.demo',
        fullName: 'Elena Rossi (Manager)',
        isAdmin: false,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'marco.supervisor@osteriaspina.demo',
        fullName: 'Marco Santoro (Supervisor)',
        isAdmin: false,
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'leo.cook@osteriaspina.demo',
        fullName: 'Leo Donati (Kitchen Staff)',
        isAdmin: false,
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'clara.hygiene@osteriaspina.demo',
        fullName: 'Clara Neri (Hygiene Staff)',
        isAdmin: false,
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'sophia.multi@culinarygroup.demo',
        fullName: 'Sophia Bellini (Multi-Tenant Staff)',
        isAdmin: false,
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, is_platform_admin, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (email) DO NOTHING`,
        [u.id, u.email, demoPasswordHash, u.fullName, u.isAdmin]
      );
    }

    // 3. Seed Restaurants
    const r1Id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const r2Id = 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    await client.query(
      `INSERT INTO restaurants (id, name, slug, description, address, phone, official_license_number, is_verified, verified_at)
       VALUES ($1, 'Osteria Della Spina', 'osteria-della-spina', 'Artisanal Italian Trattoria & Wood-Fired Kitchen', '42 Corso Venezia, Central District', '+1 (555) 019-4820', 'DEMO-REG-2026-904', TRUE, NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [r1Id]
    );

    await client.query(
      `INSERT INTO restaurants (id, name, slug, description, address, phone, official_license_number, is_verified, verified_at)
       VALUES ($1, 'Trattoria Al Sole', 'trattoria-al-sole', 'Traditional Roman Family Bistro', '18 Via Flaminia, North Harbor', '+1 (555) 019-8731', 'DEMO-REG-2026-102', FALSE, NULL)
       ON CONFLICT (slug) DO NOTHING`,
      [r2Id]
    );

    // 4. Seed Branches
    const b1Id = 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const b2Id = 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const b3Id = 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    await client.query(
      `INSERT INTO branches (id, restaurant_id, name, code, address, phone)
       VALUES ($1, $2, 'Central District (Branch 01)', 'BR-01', '42 Corso Venezia', '+1 (555) 019-4820')
       ON CONFLICT (restaurant_id, code) DO NOTHING`,
      [b1Id, r1Id]
    );

    await client.query(
      `INSERT INTO branches (id, restaurant_id, name, code, address, phone)
       VALUES ($1, $2, 'North Harbor Waterfront (Branch 02)', 'BR-02', '88 Marina Way', '+1 (555) 019-4822')
       ON CONFLICT (restaurant_id, code) DO NOTHING`,
      [b2Id, r1Id]
    );

    await client.query(
      `INSERT INTO branches (id, restaurant_id, name, code, address, phone)
       VALUES ($1, $2, 'Trattoria Al Sole - Main Kitchen', 'SOLE-01', '18 Via Flaminia', '+1 (555) 019-8731')
       ON CONFLICT (restaurant_id, code) DO NOTHING`,
      [b3Id, r2Id]
    );

    // 5. Seed Restaurant Memberships (Multi-Tenant & Role Isolation)
    const memberships = [
      { userId: users[1].id, restId: r1Id, branchId: null, role: 'restaurant_manager' },
      { userId: users[2].id, restId: r1Id, branchId: b1Id, role: 'supervisor' },
      { userId: users[3].id, restId: r1Id, branchId: b1Id, role: 'kitchen_staff' },
      { userId: users[4].id, restId: r1Id, branchId: b1Id, role: 'hygiene_staff' },
      // Sophia bellini has distinct roles in BOTH restaurants:
      { userId: users[5].id, restId: r1Id, branchId: b1Id, role: 'restaurant_manager' },
      { userId: users[5].id, restId: r2Id, branchId: b3Id, role: 'kitchen_staff' },
    ];

    for (const m of memberships) {
      await client.query(
        `INSERT INTO restaurant_memberships (user_id, restaurant_id, branch_id, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (user_id, restaurant_id, branch_id, role) DO NOTHING`,
        [m.userId, m.restId, m.branchId, m.role]
      );
    }

    // 6. Seed Menu Categories
    const categories = ['Signature Specials', 'Handmade Pasta', 'Wood-Fired Mains', 'Antipasti', 'Desserts'];
    for (let i = 0; i < categories.length; i++) {
      await client.query(
        `INSERT INTO menu_categories (restaurant_id, name, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (restaurant_id, name) DO NOTHING`,
        [r1Id, categories[i], i + 1]
      );
    }

    // 7. Seed Sample Audit Event
    await client.query(
      `INSERT INTO audit_events (restaurant_id, branch_id, actor_email, action, entity_type, entity_id, new_state)
       VALUES ($1, $2, 'system@plateproof360.internal', 'SYSTEM_INITIAL_SEED', 'SYSTEM', $1, '{"status": "initialized", "demo": true}'::jsonb)`,
      [r1Id, b1Id]
    );

    await client.query('COMMIT');
    return {
      success: true,
      message: 'Database seeded successfully with idempotent sample data and test personas.',
    };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Database seed failed: ${msg}` };
  } finally {
    client.release();
  }
}
