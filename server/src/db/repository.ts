import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool, checkDatabaseHealth } from './index.js';
import { AuthenticatedUser, UserMembership, UserRole } from '../types/auth.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  is_platform_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BranchRecord {
  id: string;
  restaurant_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  temp_thresholds?: Record<string, number>;
  is_active: boolean;
}

export interface MenuCategoryRecord {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface StructuredAllergenDeclaration {
  allergen_code: string; // e.g. 'gluten', 'dairy', 'eggs', 'peanuts', 'tree_nuts', 'fish', 'crustaceans', 'celery', 'mustard', 'sesame', 'sulphites'
  status: 'contains' | 'may_contain' | 'free_from' | 'not_provided';
  notes?: string;
}

export interface MenuItemRecord {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  dietary_tags: string[];
  is_available: boolean;
  display_order: number;
  prep_temperature?: string;
  ingredients: string[];
  allergens: StructuredAllergenDeclaration[];
  has_unverified_allergens: boolean; // TRUE if any allergen is 'not_provided' or if declarations incomplete
  created_at: string;
  updated_at: string;
}

export interface RestaurantRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  logo_url?: string;
  banner_url?: string;
  opening_hours?: string;
  official_license_number?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_source?: string;
  // Private / internal ownership information (stripped on public endpoints)
  owner_full_name?: string;
  owner_contact_email?: string;
  tax_identifier?: string;
}

export interface IncidentRecord {
  id: string;
  restaurant_id: string;
  branch_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'action_assigned' | 'awaiting_verification' | 'closed';
  internal_investigation_findings?: string;
  reported_by?: string;
  created_at: string;
}

export interface CorrectiveActionRecord {
  id: string;
  incident_id: string;
  description: string;
  assigned_to?: string;
  performed_by?: string;
  performed_at?: string;
  verified_by?: string;
  verified_at?: string;
  status: 'assigned' | 'in_progress' | 'performed_pending_verification' | 'verified_closed' | 'rejected';
  evidence_notes?: string;
}

export interface QrTokenRecord {
  id: string;
  restaurant_id: string;
  branch_id: string;
  token_hash: string;
  raw_token_for_demo?: string;
  token_type: 'table' | 'order';
  target_reference: string;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

export interface OrderSafetyCheck {
  check_type: string;
  reading_or_status: string;
  target_threshold: string;
  is_safe: boolean;
  logged_at: string;
  logged_by_role: string;
}

export interface OrderItemDetail {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_allergen_notes?: string;
  ingredients: string[];
  allergens: StructuredAllergenDeclaration[];
  has_unverified_allergens: boolean;
}

export interface OrderRecord {
  id: string;
  restaurant_id: string;
  branch_id: string;
  table_number: string;
  order_reference: string;
  status: 'placed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  placed_at: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    special_allergen_notes?: string;
  }>;
  safety_checks?: OrderSafetyCheck[];
}

// In-Memory Fallback State (initialized with demo seed data)
const salt = bcrypt.genSaltSync(10);
const demoHash = bcrypt.hashSync('PlateProof2026!Demo', salt);

const memoryUsers: UserRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@plateproof360.internal',
    password_hash: demoHash,
    full_name: 'Platform Auditor Admin',
    is_platform_admin: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'elena.manager@osteriaspina.demo',
    password_hash: demoHash,
    full_name: 'Elena Rossi (Manager)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'marco.supervisor@osteriaspina.demo',
    password_hash: demoHash,
    full_name: 'Marco Santoro (Supervisor)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'leo.cook@osteriaspina.demo',
    password_hash: demoHash,
    full_name: 'Leo Donati (Kitchen Staff)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'clara.hygiene@osteriaspina.demo',
    password_hash: demoHash,
    full_name: 'Clara Neri (Hygiene Staff)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'sophia.multi@culinarygroup.demo',
    password_hash: demoHash,
    full_name: 'Sophia Bellini (Multi-Tenant Staff)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'gianluigi.manager@trattoriaalsole.demo',
    password_hash: demoHash,
    full_name: 'Gianluigi Sole (Sole Manager)',
    is_platform_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const memoryRestaurants: RestaurantRecord[] = [
  {
    id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Osteria Della Spina',
    slug: 'osteria-della-spina',
    description: 'Artisanal Italian Trattoria & Wood-Fired Kitchen',
    address: '42 Corso Venezia, Central District',
    phone: '+1 (555) 019-4820',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    opening_hours: 'Tue – Sun: 12:00 PM – 10:30 PM (Mon Closed)',
    official_license_number: 'DEMO-REG-2026-904',
    is_verified: true,
    verified_at: '2026-10-15T10:00:00Z',
    verification_source: 'Municipal Food Safety Authority & Platform Inspection Register',
    owner_full_name: 'Elena Rossi',
    owner_contact_email: 'elena.rossi.private@osteriaspina.demo',
    tax_identifier: 'IT-VAT-99887711',
  },
  {
    id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Trattoria Al Sole',
    slug: 'trattoria-al-sole',
    description: 'Traditional Roman Family Bistro',
    address: '18 Via Flaminia, North Harbor',
    phone: '+1 (555) 019-8731',
    official_license_number: 'DEMO-REG-2026-102',
    is_verified: false,
    owner_full_name: 'Gianluigi Sole',
    owner_contact_email: 'gianluigi.private@trattoriaalsole.demo',
  },
];

const memoryBranches: BranchRecord[] = [
  {
    id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Central District (Branch 01)',
    code: 'BR-01',
    address: '42 Corso Venezia, Central District',
    phone: '+1 (555) 019-4820',
    is_active: true,
  },
  {
    id: 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'North Harbor Waterfront (Branch 02)',
    code: 'BR-02',
    address: '88 Marina Way, North Harbor',
    phone: '+1 (555) 019-4822',
    is_active: true,
  },
  {
    id: 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    restaurant_id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Trattoria Al Sole - Main Kitchen',
    code: 'SOLE-01',
    address: '18 Via Flaminia, North Harbor',
    phone: '+1 (555) 019-8731',
    is_active: true,
  },
];

const memoryMemberships: Array<{
  id: string;
  userId: string;
  restaurantId: string;
  branchId: string | null;
  role: UserRole;
}> = [
  {
    id: 'm-1',
    userId: '22222222-2222-2222-2222-222222222222',
    restaurantId: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: null,
    role: 'restaurant_manager',
  },
  {
    id: 'm-2',
    userId: '33333333-3333-3333-3333-333333333333',
    restaurantId: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'supervisor',
  },
  {
    id: 'm-3',
    userId: '44444444-4444-4444-4444-444444444444',
    restaurantId: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'kitchen_staff',
  },
  {
    id: 'm-4',
    userId: '55555555-5555-5555-5555-555555555555',
    restaurantId: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'hygiene_staff',
  },
  {
    id: 'm-5a',
    userId: '66666666-6666-6666-6666-666666666666',
    restaurantId: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: null,
    role: 'restaurant_manager',
  },
  {
    id: 'm-5b',
    userId: '66666666-6666-6666-6666-666666666666',
    restaurantId: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'kitchen_staff',
  },
  {
    id: 'm-6',
    userId: '77777777-7777-7777-7777-777777777777',
    restaurantId: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branchId: 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'restaurant_manager',
  },
];

const memoryCategories: MenuCategoryRecord[] = [
  {
    id: 'cat-1',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Chef Specials',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cat-2',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Handmade Pasta',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cat-3',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Wood-Fired Mains',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'cat-4',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Antipasti',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'cat-5',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Desserts',
    display_order: 5,
    is_active: true,
  },
];

const memoryMenuItems: MenuItemRecord[] = [
  {
    id: 'item-01',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    category_id: 'cat-2',
    name: 'Truffle Tagliolini al Burro',
    description: 'Hand-rolled egg pasta with black winter truffle butter, 30-month aged Parmigiano Reggiano, and cold-pressed olive oil.',
    price: 24.5,
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian'],
    is_available: true,
    display_order: 1,
    prep_temperature: 'Cooked to 85°C (Safety Min: 75°C)',
    ingredients: ['Egg Tagliolini', 'Black Winter Truffle', 'Parmigiano Reggiano 30M', 'Butter', 'Olive Oil'],
    allergens: [
      { allergen_code: 'gluten', status: 'contains', notes: 'Wheat flour pasta' },
      { allergen_code: 'dairy', status: 'contains', notes: 'Butter & Parmigiano' },
      { allergen_code: 'eggs', status: 'contains', notes: 'Egg pasta dough' },
      { allergen_code: 'peanuts', status: 'free_from' },
      { allergen_code: 'celery', status: 'free_from' },
    ],
    has_unverified_allergens: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-02',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    category_id: 'cat-3',
    name: 'Slow-Braised Osso Buco',
    description: 'Cross-cut veal shank braised with San Marzano tomatoes, white wine, and aromatic herbs over saffron risotto.',
    price: 34.0,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Gluten-Free'],
    is_available: true,
    display_order: 2,
    prep_temperature: 'Simmered at 92°C (Safety Min: 75°C)',
    ingredients: ['Cross-cut Veal Shank', 'San Marzano Tomatoes', 'White Wine', 'Saffron Risotto', 'Celery'],
    allergens: [
      { allergen_code: 'celery', status: 'contains', notes: 'Celery in soffritto base' },
      { allergen_code: 'sulphites', status: 'contains', notes: 'White wine deglaze' },
      { allergen_code: 'gluten', status: 'free_from' },
      { allergen_code: 'dairy', status: 'free_from' },
    ],
    has_unverified_allergens: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-03',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    category_id: 'cat-4',
    name: 'Burrata Pugliese & Heirloom Tomato',
    description: 'Creamy hand-tied burrata pugliese with multi-coloured heirloom tomatoes, wild arugula, and aged balsamic glaze.',
    price: 18.0,
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
    is_available: true,
    display_order: 3,
    prep_temperature: 'Chilled display 3.2°C (Max: 4.0°C)',
    ingredients: ['Burrata Pugliese', 'Heirloom Tomatoes', 'Wild Arugula', 'Aged Balsamic'],
    allergens: [
      { allergen_code: 'dairy', status: 'contains', notes: 'Fresh burrata' },
      { allergen_code: 'gluten', status: 'free_from' },
      { allergen_code: 'tree_nuts', status: 'free_from' },
    ],
    has_unverified_allergens: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-04',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    category_id: 'cat-1',
    name: 'Daily Harbor Market Catch Stew',
    description: 'Fresh dockside fish selection simmered in saffron tomato broth. Ingredients vary by morning catch.',
    price: 28.5,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Pescatarian'],
    is_available: true,
    display_order: 4,
    prep_temperature: 'Simmered to 88°C',
    ingredients: ['Market Whitefish', 'Molluscs/Bivalves', 'Garlic', 'Tomato Broth'],
    allergens: [
      { allergen_code: 'fish', status: 'contains', notes: 'Whitefish' },
      { allergen_code: 'molluscs', status: 'contains', notes: 'Clams / Mussels' },
      { allergen_code: 'crustaceans', status: 'not_provided', notes: 'May contain crustaceans depending on dock batch' },
      { allergen_code: 'sulphites', status: 'not_provided', notes: 'Stock wine unverified' },
    ],
    // NOTICE: Has unverified allergens because status is not_provided!
    has_unverified_allergens: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const memoryIncidents: IncidentRecord[] = [];
const memoryCorrectiveActions: CorrectiveActionRecord[] = [];
const memoryAuditEvents: Array<Record<string, unknown>> = [];

const hashTokenString = (token: string): string =>
  crypto.createHash('sha256').update(token.trim()).digest('hex');

const memoryOrders: OrderRecord[] = [
  {
    id: 'ord-demo-01',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    table_number: 'Table 04',
    order_reference: 'ORD-7294',
    status: 'served',
    placed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: [
      {
        menu_item_id: 'item-01',
        quantity: 1,
        special_allergen_notes: 'Table requested no extra butter on finish',
      },
      {
        menu_item_id: 'item-02',
        quantity: 1,
      },
    ],
    safety_checks: [
      {
        check_type: 'CCP-1 Chiller Temperature Verification',
        reading_or_status: '3.2°C',
        target_threshold: 'Max 4.0°C (HACCP Chiller Compliant)',
        is_safe: true,
        logged_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        logged_by_role: 'Kitchen Line 1 (Chef Marco)',
      },
      {
        check_type: 'CCP-2 Internal Core Cook Temperature',
        reading_or_status: '85.4°C',
        target_threshold: 'Min 75.0°C (Core Cooking Passed)',
        is_safe: true,
        logged_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        logged_by_role: 'Kitchen Line 1 (Chef Marco)',
      },
      {
        check_type: 'Supervisor Allergen Cross-Contact Check',
        reading_or_status: 'PASSED (Dedicated allergen prep utensils verified)',
        target_threshold: 'Dual-control cross-contact protocol',
        is_safe: true,
        logged_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        logged_by_role: 'Supervisor (Marco Santoro)',
      },
    ],
  },
  {
    id: 'ord-demo-02',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    table_number: 'Table 07',
    order_reference: 'ORD-8812',
    status: 'preparing',
    placed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      {
        menu_item_id: 'item-03',
        quantity: 1,
      },
      {
        menu_item_id: 'item-04',
        quantity: 1,
        special_allergen_notes: 'Guest noted mild shellfish sensitivity',
      },
    ],
    safety_checks: [
      {
        check_type: 'CCP-1 Raw Catch Storage Cold Chain',
        reading_or_status: '2.8°C',
        target_threshold: 'Max 4.0°C (Raw Seafood Storage)',
        is_safe: true,
        logged_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        logged_by_role: 'Kitchen Staff (Leo Donati)',
      },
      {
        check_type: 'Allergen Advisory Verification',
        reading_or_status: 'CAUTION: Unverified market bivalve stock flagged',
        target_threshold: 'Customer notification required',
        is_safe: false,
        logged_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        logged_by_role: 'Supervisor (Marco Santoro)',
      },
    ],
  },
  {
    id: 'ord-demo-03',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    table_number: 'Table 02',
    order_reference: 'ORD-3001',
    status: 'completed',
    placed_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        menu_item_id: 'item-01',
        quantity: 2,
      },
    ],
  },
];

const memoryQrTokens: QrTokenRecord[] = [
  // 1. Stable Table Tokens
  {
    id: 'qr-tbl-01',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'tbl_osteria_t04',
    token_hash: hashTokenString('tbl_osteria_t04'),
    token_type: 'table',
    target_reference: 'Table 04',
    expires_at: null,
    is_revoked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'qr-tbl-02',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'tbl_osteria_t07',
    token_hash: hashTokenString('tbl_osteria_t07'),
    token_type: 'table',
    target_reference: 'Table 07',
    expires_at: null,
    is_revoked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'qr-tbl-03',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'tbl_osteria_t12',
    token_hash: hashTokenString('tbl_osteria_t12'),
    token_type: 'table',
    target_reference: 'Table 12',
    expires_at: null,
    is_revoked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'qr-tbl-revoked',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'tbl_osteria_revoked',
    token_hash: hashTokenString('tbl_osteria_revoked'),
    token_type: 'table',
    target_reference: 'Table 99',
    expires_at: null,
    is_revoked: true,
    created_at: new Date().toISOString(),
  },
  // 2. Cryptographic Order Tokens
  {
    id: 'qr-ord-01',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'ord_token_7294',
    token_hash: hashTokenString('ord_token_7294'),
    token_type: 'order',
    target_reference: 'ord-demo-01',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_revoked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'qr-ord-02',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'ord_token_8812',
    token_hash: hashTokenString('ord_token_8812'),
    token_type: 'order',
    target_reference: 'ord-demo-02',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_revoked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'qr-ord-expired',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'ord_token_expired',
    token_hash: hashTokenString('ord_token_expired'),
    token_type: 'order',
    target_reference: 'ord-demo-03',
    expires_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Expired 2h ago!
    is_revoked: false,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'qr-ord-revoked',
    restaurant_id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    branch_id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    raw_token_for_demo: 'ord_token_revoked',
    token_hash: hashTokenString('ord_token_revoked'),
    token_type: 'order',
    target_reference: 'ord-demo-01',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_revoked: true, // Explicitly revoked by staff!
    created_at: new Date().toISOString(),
  },
];

export class Repository {
  public static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<UserRecord>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE',
        [email]
      );
      return res.rows[0] || null;
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public static async findUserById(id: string): Promise<UserRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<UserRecord>(
        'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
        [id]
      );
      return res.rows[0] || null;
    }
    return memoryUsers.find((u) => u.id === id) || null;
  }

  public static async getUserMemberships(userId: string): Promise<UserMembership[]> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<{ restaurant_id: string; branch_id: string | null; role: string }>(
        'SELECT restaurant_id, branch_id, role FROM restaurant_memberships WHERE user_id = $1 AND is_active = TRUE',
        [userId]
      );
      return res.rows.map((r) => ({
        restaurantId: r.restaurant_id,
        branchId: r.branch_id,
        role: r.role as UserRole,
      }));
    }
    return memoryMemberships
      .filter((m) => m.userId === userId)
      .map((m) => ({
        restaurantId: m.restaurantId,
        branchId: m.branchId,
        role: m.role,
      }));
  }

  public static async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    isPlatformAdmin?: boolean;
  }): Promise<UserRecord> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<UserRecord>(
        `INSERT INTO users (email, password_hash, full_name, is_platform_admin, is_active)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
        [data.email, data.passwordHash, data.fullName, !!data.isPlatformAdmin]
      );
      return res.rows[0];
    }
    const newUser: UserRecord = {
      id,
      email: data.email,
      password_hash: data.passwordHash,
      full_name: data.fullName,
      is_platform_admin: !!data.isPlatformAdmin,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    memoryUsers.push(newUser);
    return newUser;
  }

  public static async findRestaurantById(restaurantId: string): Promise<RestaurantRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<RestaurantRecord>(
        'SELECT * FROM restaurants WHERE id = $1',
        [restaurantId]
      );
      return res.rows[0] || null;
    }
    return memoryRestaurants.find((r) => r.id === restaurantId) || null;
  }

  public static async updateRestaurant(
    restaurantId: string,
    updates: Partial<RestaurantRecord>
  ): Promise<RestaurantRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      // In PostgreSQL:
      const res = await pool.query<RestaurantRecord>(
        `UPDATE restaurants SET 
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          is_verified = COALESCE($4, is_verified),
          updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [restaurantId, updates.name, updates.description, updates.is_verified]
      );
      return res.rows[0] || null;
    }
    const rest = memoryRestaurants.find((r) => r.id === restaurantId);
    if (!rest) return null;
    Object.assign(rest, updates);
    return rest;
  }

  public static async createIncidentWithAudit(
    incident: Omit<IncidentRecord, 'id' | 'created_at'>,
    actionDesc: string,
    assignedToId?: string
  ): Promise<{ incident: IncidentRecord; action: CorrectiveActionRecord }> {
    const incidentId = `inc-${Date.now()}`;
    const actionId = `act-${Date.now()}`;
    const now = new Date().toISOString();

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const incRes = await client.query<IncidentRecord>(
          `INSERT INTO safety_incidents (id, restaurant_id, branch_id, title, severity, status, internal_investigation_findings, reported_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            incidentId,
            incident.restaurant_id,
            incident.branch_id,
            incident.title,
            incident.severity,
            incident.status,
            incident.internal_investigation_findings,
            incident.reported_by,
          ]
        );

        const actRes = await client.query<CorrectiveActionRecord>(
          `INSERT INTO corrective_actions (id, incident_id, description, assigned_to, status)
           VALUES ($1, $2, $3, $4, 'assigned') RETURNING *`,
          [actionId, incidentId, actionDesc, assignedToId]
        );

        await client.query(
          `INSERT INTO audit_events (restaurant_id, branch_id, actor_id, action, entity_type, entity_id, new_state)
           VALUES ($1, $2, $3, 'INCIDENT_CREATED', 'safety_incidents', $4, $5)`,
          [incident.restaurant_id, incident.branch_id, incident.reported_by, incidentId, JSON.stringify(incRes.rows[0])]
        );

        await client.query('COMMIT');
        return { incident: incRes.rows[0], action: actRes.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const newInc: IncidentRecord = {
      id: incidentId,
      ...incident,
      created_at: now,
    };
    const newAct: CorrectiveActionRecord = {
      id: actionId,
      incident_id: incidentId,
      description: actionDesc,
      assigned_to: assignedToId,
      status: 'assigned',
    };
    memoryIncidents.push(newInc);
    memoryCorrectiveActions.push(newAct);
    memoryAuditEvents.push({
      action: 'INCIDENT_CREATED',
      incidentId,
      restaurantId: incident.restaurant_id,
      timestamp: now,
    });

    return { incident: newInc, action: newAct };
  }

  public static async performCorrectiveAction(
    actionId: string,
    performedByUserId: string,
    evidenceNotes: string
  ): Promise<CorrectiveActionRecord> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<CorrectiveActionRecord>(
        `UPDATE corrective_actions SET
          performed_by = $2,
          performed_at = NOW(),
          evidence_notes = $3,
          status = 'performed_pending_verification'
         WHERE id = $1 RETURNING *`,
        [actionId, performedByUserId, evidenceNotes]
      );
      return res.rows[0];
    }
    const act = memoryCorrectiveActions.find((a) => a.id === actionId);
    if (!act) throw new Error('Action not found');
    act.performed_by = performedByUserId;
    act.performed_at = new Date().toISOString();
    act.evidence_notes = evidenceNotes;
    act.status = 'performed_pending_verification';
    return act;
  }

  public static async verifyCorrectiveAction(
    actionId: string,
    supervisorId: string,
    decision: 'approved' | 'rejected',
    comments: string
  ): Promise<CorrectiveActionRecord> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const actRes = await client.query<CorrectiveActionRecord>(
          'SELECT * FROM corrective_actions WHERE id = $1',
          [actionId]
        );
        const action = actRes.rows[0];
        if (!action) throw new Error('Corrective action not found');

        // DUAL-CONTROL RULE VERIFICATION:
        if (action.performed_by === supervisorId) {
          throw new Error('Dual-Control Violation: A supervisor cannot verify an action they performed themselves.');
        }

        const updated = await client.query<CorrectiveActionRecord>(
          `UPDATE corrective_actions SET
            verified_by = $2,
            verified_at = NOW(),
            status = $3
           WHERE id = $1 RETURNING *`,
          [actionId, supervisorId, decision === 'approved' ? 'verified_closed' : 'rejected']
        );

        await client.query(
          `INSERT INTO verification_decisions (corrective_action_id, supervisor_id, decision, review_comments)
           VALUES ($1, $2, $3, $4)`,
          [actionId, supervisorId, decision, comments]
        );

        await client.query('COMMIT');
        return updated.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const action = memoryCorrectiveActions.find((a) => a.id === actionId);
    if (!action) throw new Error('Corrective action not found');

    // DUAL-CONTROL RULE VERIFICATION:
    if (action.performed_by === supervisorId) {
      throw new Error('Dual-Control Violation: A supervisor cannot verify an action they performed themselves.');
    }

    action.verified_by = supervisorId;
    action.verified_at = new Date().toISOString();
    action.status = decision === 'approved' ? 'verified_closed' : 'rejected';
    return action;
  }

  // ==========================================
  // PHASE 4: BRANCH MANAGEMENT
  // ==========================================
  public static async findBranchesByRestaurantId(restaurantId: string): Promise<BranchRecord[]> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<BranchRecord>(
        'SELECT * FROM branches WHERE restaurant_id = $1 AND is_active = TRUE ORDER BY created_at ASC',
        [restaurantId]
      );
      return res.rows;
    }
    return memoryBranches.filter((b) => b.restaurant_id === restaurantId && b.is_active);
  }

  public static async findBranchById(branchId: string): Promise<BranchRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<BranchRecord>(
        'SELECT * FROM branches WHERE id = $1 AND is_active = TRUE',
        [branchId]
      );
      return res.rows[0] || null;
    }
    return memoryBranches.find((b) => b.id === branchId && b.is_active) || null;
  }

  public static async createBranch(
    restaurantId: string,
    data: { name: string; code: string; address: string; phone: string }
  ): Promise<BranchRecord> {
    const id = `branch-${Date.now()}`;
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<BranchRecord>(
        `INSERT INTO branches (id, restaurant_id, name, code, address, phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, restaurantId, data.name, data.code, data.address, data.phone]
      );
      return res.rows[0];
    }
    const newBranch: BranchRecord = {
      id,
      restaurant_id: restaurantId,
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone,
      is_active: true,
    };
    memoryBranches.push(newBranch);
    return newBranch;
  }

  // ==========================================
  // PHASE 4: MENU CATEGORIES
  // ==========================================
  public static async findCategoriesByRestaurantId(restaurantId: string): Promise<MenuCategoryRecord[]> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<MenuCategoryRecord>(
        'SELECT * FROM menu_categories WHERE restaurant_id = $1 AND is_active = TRUE ORDER BY display_order ASC, name ASC',
        [restaurantId]
      );
      return res.rows;
    }
    return memoryCategories
      .filter((c) => c.restaurant_id === restaurantId && c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }

  public static async createCategory(
    restaurantId: string,
    name: string,
    displayOrder: number = 0
  ): Promise<MenuCategoryRecord> {
    const id = `cat-${Date.now()}`;
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<MenuCategoryRecord>(
        `INSERT INTO menu_categories (id, restaurant_id, name, display_order, is_active)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
        [id, restaurantId, name, displayOrder]
      );
      return res.rows[0];
    }
    const newCat: MenuCategoryRecord = {
      id,
      restaurant_id: restaurantId,
      name,
      display_order: displayOrder,
      is_active: true,
    };
    memoryCategories.push(newCat);
    return newCat;
  }

  public static async updateCategory(
    restaurantId: string,
    categoryId: string,
    updates: Partial<MenuCategoryRecord>
  ): Promise<MenuCategoryRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<MenuCategoryRecord>(
        `UPDATE menu_categories SET
          name = COALESCE($3, name),
          display_order = COALESCE($4, display_order),
          is_active = COALESCE($5, is_active)
         WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
        [categoryId, restaurantId, updates.name, updates.display_order, updates.is_active]
      );
      return res.rows[0] || null;
    }
    const cat = memoryCategories.find((c) => c.id === categoryId && c.restaurant_id === restaurantId);
    if (!cat) return null;
    Object.assign(cat, updates);
    return cat;
  }

  public static async deleteCategory(restaurantId: string, categoryId: string): Promise<boolean> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query(
        'UPDATE menu_categories SET is_active = FALSE WHERE id = $1 AND restaurant_id = $2',
        [categoryId, restaurantId]
      );
      return (res.rowCount || 0) > 0;
    }
    const cat = memoryCategories.find((c) => c.id === categoryId && c.restaurant_id === restaurantId);
    if (!cat) return false;
    cat.is_active = false;
    return true;
  }

  // ==========================================
  // PHASE 4: MENU ITEMS & STRUCTURED ALLERGENS
  // ==========================================
  public static async findMenuItemsByRestaurantId(
    restaurantId: string,
    onlyAvailable: boolean = false
  ): Promise<MenuItemRecord[]> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      let queryStr = 'SELECT * FROM menu_items WHERE restaurant_id = $1';
      const params: unknown[] = [restaurantId];
      if (onlyAvailable) {
        queryStr += ' AND is_available = TRUE';
      }
      queryStr += ' ORDER BY display_order ASC, name ASC';
      const res = await pool.query<MenuItemRecord>(queryStr, params);
      return res.rows;
    }
    return memoryMenuItems
      .filter((item) => {
        if (item.restaurant_id !== restaurantId) return false;
        if (onlyAvailable && !item.is_available) return false;
        return true;
      })
      .sort((a, b) => a.display_order - b.display_order);
  }

  public static async findMenuItemById(
    restaurantId: string,
    itemId: string
  ): Promise<MenuItemRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<MenuItemRecord>(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [itemId, restaurantId]
      );
      return res.rows[0] || null;
    }
    return (
      memoryMenuItems.find(
        (item) => item.id === itemId && item.restaurant_id === restaurantId
      ) || null
    );
  }

  public static async createMenuItem(
    restaurantId: string,
    data: {
      category_id: string;
      name: string;
      description?: string;
      price: number;
      image_url?: string;
      dietary_tags?: string[];
      is_available?: boolean;
      display_order?: number;
      prep_temperature?: string;
      ingredients?: string[];
      allergens?: StructuredAllergenDeclaration[];
    }
  ): Promise<MenuItemRecord> {
    const id = `item-${Date.now()}`;
    const now = new Date().toISOString();
    const allergens = data.allergens || [];
    // Clear unknown/not-provided allergen state check:
    // If no allergens are declared, or any allergen has status 'not_provided', mark has_unverified_allergens = true!
    const hasUnverified = allergens.length === 0 || allergens.some((a) => a.status === 'not_provided');

    const newItem: MenuItemRecord = {
      id,
      restaurant_id: restaurantId,
      category_id: data.category_id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      image_url:
        data.image_url ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      dietary_tags: data.dietary_tags || [],
      is_available: data.is_available !== undefined ? data.is_available : true,
      display_order: data.display_order || 0,
      prep_temperature: data.prep_temperature,
      ingredients: data.ingredients || [],
      allergens,
      has_unverified_allergens: hasUnverified,
      created_at: now,
      updated_at: now,
    };

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      await pool.query(
        `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, dietary_tags, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          restaurantId,
          data.category_id,
          data.name,
          data.description,
          data.price,
          data.image_url,
          data.dietary_tags,
          newItem.is_available,
        ]
      );
    }

    memoryMenuItems.push(newItem);
    return newItem;
  }

  public static async updateMenuItem(
    restaurantId: string,
    itemId: string,
    updates: Partial<MenuItemRecord>
  ): Promise<MenuItemRecord | null> {
    const item = await this.findMenuItemById(restaurantId, itemId);
    if (!item) return null;

    if (updates.allergens) {
      updates.has_unverified_allergens =
        updates.allergens.length === 0 ||
        updates.allergens.some((a) => a.status === 'not_provided');
    }

    Object.assign(item, updates, { updated_at: new Date().toISOString() });

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      await pool.query(
        `UPDATE menu_items SET
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          price = COALESCE($5, price),
          image_url = COALESCE($6, image_url),
          is_available = COALESCE($7, is_available),
          updated_at = NOW()
         WHERE id = $1 AND restaurant_id = $2`,
        [itemId, restaurantId, updates.name, updates.description, updates.price, updates.image_url, updates.is_available]
      );
    }

    return item;
  }

  public static async toggleMenuItemAvailability(
    restaurantId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<MenuItemRecord | null> {
    return this.updateMenuItem(restaurantId, itemId, { is_available: isAvailable });
  }

  public static async deleteMenuItem(restaurantId: string, itemId: string): Promise<boolean> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query(
        'DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [itemId, restaurantId]
      );
      return (res.rowCount || 0) > 0;
    }
    const idx = memoryMenuItems.findIndex(
      (item) => item.id === itemId && item.restaurant_id === restaurantId
    );
    if (idx === -1) return false;
    memoryMenuItems.splice(idx, 1);
    return true;
  }

  public static async reorderMenuItems(
    restaurantId: string,
    orderedItemIds: string[]
  ): Promise<void> {
    for (let i = 0; i < orderedItemIds.length; i++) {
      const item = memoryMenuItems.find(
        (m) => m.id === orderedItemIds[i] && m.restaurant_id === restaurantId
      );
      if (item) {
        item.display_order = i + 1;
      }
    }
  }

  // ==========================================
  // Phase 5: QR Code & Order Access Methods
  // ==========================================

  public static async findQrTokenByRaw(rawToken: string): Promise<QrTokenRecord | null> {
    const cleanToken = rawToken.trim();
    const hash = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<QrTokenRecord>(
        'SELECT * FROM qr_tokens WHERE token_hash = $1',
        [hash]
      );
      if (res.rows[0]) return res.rows[0];
    }

    return (
      memoryQrTokens.find(
        (t) => t.token_hash === hash || t.raw_token_for_demo === cleanToken
      ) || null
    );
  }

  public static async findQrTokenById(
    tokenId: string,
    restaurantId?: string
  ): Promise<QrTokenRecord | null> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const query = restaurantId
        ? 'SELECT * FROM qr_tokens WHERE id = $1 AND restaurant_id = $2'
        : 'SELECT * FROM qr_tokens WHERE id = $1';
      const params = restaurantId ? [tokenId, restaurantId] : [tokenId];
      const res = await pool.query<QrTokenRecord>(query, params);
      return res.rows[0] || null;
    }

    return (
      memoryQrTokens.find((t) => {
        if (restaurantId) {
          return t.id === tokenId && t.restaurant_id === restaurantId;
        }
        return t.id === tokenId;
      }) || null
    );
  }

  public static async listTableQrTokens(restaurantId: string): Promise<QrTokenRecord[]> {
    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query<QrTokenRecord>(
        "SELECT * FROM qr_tokens WHERE restaurant_id = $1 AND token_type = 'table' ORDER BY created_at DESC",
        [restaurantId]
      );
      return res.rows;
    }

    return memoryQrTokens.filter(
      (t) => t.restaurant_id === restaurantId && t.token_type === 'table'
    );
  }

  public static async createTableQrToken(
    restaurantId: string,
    branchId: string,
    tableNumber: string,
    rawToken: string
  ): Promise<QrTokenRecord> {
    const id = `qr-tbl-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const now = new Date().toISOString();

    const record: QrTokenRecord = {
      id,
      restaurant_id: restaurantId,
      branch_id: branchId,
      token_hash: hash,
      raw_token_for_demo: rawToken,
      token_type: 'table',
      target_reference: tableNumber,
      expires_at: null, // Table tokens are permanent until revoked/replaced
      is_revoked: false,
      created_at: now,
    };

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      await pool.query(
        `INSERT INTO qr_tokens (id, restaurant_id, branch_id, token_hash, token_type, target_reference, expires_at, is_revoked)
         VALUES ($1, $2, $3, $4, 'table', $5, NULL, FALSE)`,
        [id, restaurantId, branchId, hash, tableNumber]
      );
    }

    memoryQrTokens.unshift(record);
    return record;
  }

  public static async createOrderQrToken(
    restaurantId: string,
    branchId: string,
    orderId: string,
    rawToken: string,
    expiresInHours = 24
  ): Promise<QrTokenRecord> {
    const id = `qr-ord-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

    const record: QrTokenRecord = {
      id,
      restaurant_id: restaurantId,
      branch_id: branchId,
      token_hash: hash,
      raw_token_for_demo: rawToken,
      token_type: 'order',
      target_reference: orderId,
      expires_at: expiresAt,
      is_revoked: false,
      created_at: now.toISOString(),
    };

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      await pool.query(
        `INSERT INTO qr_tokens (id, restaurant_id, branch_id, token_hash, token_type, target_reference, expires_at, is_revoked)
         VALUES ($1, $2, $3, $4, 'order', $5, $6, FALSE)`,
        [id, restaurantId, branchId, hash, orderId, expiresAt]
      );
    }

    memoryQrTokens.unshift(record);
    return record;
  }

  public static async revokeQrToken(
    tokenId: string,
    restaurantId: string
  ): Promise<boolean> {
    const token = await this.findQrTokenById(tokenId, restaurantId);
    if (!token) {
      return false;
    }

    token.is_revoked = true;

    const health = await checkDatabaseHealth();
    if (health.status === 'connected') {
      const res = await pool.query(
        'UPDATE qr_tokens SET is_revoked = TRUE WHERE id = $1 AND restaurant_id = $2',
        [tokenId, restaurantId]
      );
      return (res.rowCount || 0) > 0;
    }

    return true;
  }

  public static async findOrderById(
    orderId: string,
    restaurantId?: string
  ): Promise<OrderRecord | null> {
    const order = memoryOrders.find((o) => {
      if (restaurantId) {
        return o.id === orderId && o.restaurant_id === restaurantId;
      }
      return o.id === orderId;
    });
    return order || null;
  }

  public static async findOrderByReference(
    reference: string,
    restaurantId?: string
  ): Promise<OrderRecord | null> {
    const order = memoryOrders.find((o) => {
      if (restaurantId) {
        return o.order_reference.toLowerCase() === reference.toLowerCase() && o.restaurant_id === restaurantId;
      }
      return o.order_reference.toLowerCase() === reference.toLowerCase();
    });
    return order || null;
  }

  public static async listRestaurantOrders(
    restaurantId: string,
    branchId?: string
  ): Promise<OrderRecord[]> {
    return memoryOrders.filter((o) => {
      if (o.restaurant_id !== restaurantId) return false;
      if (branchId && o.branch_id !== branchId) return false;
      return true;
    });
  }

  /**
   * Resolves order details for a customer scanning an order QR.
   * STRICT SECURITY: Zero customer personal identifiable information (PII) returned.
   * Returns only order items, allergen disclosures, and logged CCP temperatures.
   */
  public static async findOrderForCustomerToken(orderId: string) {
    const order = await this.findOrderById(orderId);
    if (!order) return null;

    const restaurant = await this.findRestaurantById(order.restaurant_id);
    const branch = await this.findBranchById(order.branch_id);

    // Hydrate ordered dishes with allergen safety records
    const hydratedItems: OrderItemDetail[] = [];
    for (const item of order.items) {
      const menuItem = await this.findMenuItemById(order.restaurant_id, item.menu_item_id);
      if (menuItem) {
        hydratedItems.push({
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          special_allergen_notes: item.special_allergen_notes,
          ingredients: menuItem.ingredients,
          allergens: menuItem.allergens,
          has_unverified_allergens: menuItem.has_unverified_allergens,
        });
      }
    }

    return {
      orderId: order.id,
      orderReference: order.order_reference,
      tableNumber: order.table_number,
      status: order.status,
      placedAt: order.placed_at,
      restaurant: restaurant
        ? {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            address: restaurant.address,
            phone: restaurant.phone,
            is_verified: restaurant.is_verified,
            verification_source: restaurant.verification_source,
          }
        : null,
      branch: branch
        ? {
            id: branch.id,
            name: branch.name,
            code: branch.code,
            address: branch.address,
            phone: branch.phone,
          }
        : null,
      items: hydratedItems,
      safetyChecks: order.safety_checks || [],
      // Seamless link to complaint workflow
      complaintFilingUrl: `/complaint?orderRef=${encodeURIComponent(order.order_reference)}&restId=${order.restaurant_id}`,
      allergyAdvisoryNotice:
        'Allergen declarations reflect kitchen preparation standards. Cross-contact risk cannot be eliminated in shared prep environments. If you suspect an adverse reaction, contact staff or emergency medical services immediately.',
    };
  }
}
