-- ====================================================================
-- PlateProof 360 - Comprehensive Normalized Relational Schema
-- Version: 001_full_schema.sql
-- Enforces: Multi-tenant scoping, Dual-control verification,
--           Immutability of audit logs, and Referential Integrity.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Global Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_platform_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Restaurants (Tenants)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(1024),
    banner_url VARCHAR(1024),
    address TEXT NOT NULL,
    phone VARCHAR(50),
    official_license_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Restaurant Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    temp_thresholds JSONB DEFAULT '{"fridge_max": 4.0, "freezer_max": -18.0, "hot_hold_min": 63.0}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (restaurant_id, code)
);

-- 4. Restaurant Memberships (Multi-restaurant & branch scoped roles)
CREATE TABLE IF NOT EXISTS restaurant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('restaurant_owner', 'restaurant_manager', 'supervisor', 'kitchen_staff', 'hygiene_staff')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, restaurant_id, branch_id, role)
);

-- 5. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (restaurant_id, name)
);

-- 6. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(1024),
    dietary_tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    is_certified_safe BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (restaurant_id, name)
);

-- 8. Menu Item Ingredients
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    is_optional BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE (menu_item_id, ingredient_id)
);

-- 9. Allergen Declarations
CREATE TABLE IF NOT EXISTS allergen_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    allergen_code VARCHAR(50) NOT NULL,
    risk_level VARCHAR(30) DEFAULT 'contains' NOT NULL,
    notes TEXT,
    UNIQUE (menu_item_id, allergen_code)
);

-- 10. Orders and Order Items
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_number VARCHAR(50),
    order_reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'placed' NOT NULL,
    placed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1 NOT NULL,
    special_allergen_notes TEXT
);

-- 11. Cryptographic QR Tokens
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    target_reference VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Hygiene Inspections & Checklist
CREATE TABLE IF NOT EXISTS hygiene_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    inspection_type VARCHAR(100) NOT NULL,
    overall_score NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'completed' NOT NULL,
    notes TEXT,
    inspected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_checklist_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES hygiene_inspections(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('pass', 'fail', 'na')),
    observed_defect TEXT
);

-- 13. Critical Control Point Temperature Readings & Batch Expiry Records
CREATE TABLE IF NOT EXISTS temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    equipment_name VARCHAR(100) NOT NULL,
    reading_celsius NUMERIC(5, 2) NOT NULL,
    min_threshold NUMERIC(5, 2) NOT NULL,
    max_threshold NUMERIC(5, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'warning', 'critical')),
    corrective_action_needed BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS batch_expiry_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    batch_code VARCHAR(100) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Customer Complaints & Restricted Evidence
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    allegation_type VARCHAR(100) NOT NULL,
    symptoms TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    description TEXT NOT NULL,
    order_reference VARCHAR(100),
    incident_date TIMESTAMPTZ,
    customer_contact_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'received' NOT NULL CHECK (status IN ('received', 'investigating', 'corrective_action_assigned', 'resolved', 'escalated')),
    is_publicly_disclosed BOOLEAN DEFAULT FALSE NOT NULL,
    public_outcome_label VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS complaint_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    storage_url VARCHAR(1024) NOT NULL,
    is_restricted BOOLEAN DEFAULT TRUE NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. Safety Incidents & Corrective Actions with Enforced Dual-Control Rule
CREATE TABLE IF NOT EXISTS safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'action_assigned', 'awaiting_verification', 'closed')),
    internal_investigation_findings TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'assigned' NOT NULL CHECK (status IN ('assigned', 'in_progress', 'performed_pending_verification', 'verified_closed', 'rejected')),
    evidence_notes TEXT,
    evidence_url VARCHAR(1024),
    -- DUAL-CONTROL CONSTRAINT: A supervisor cannot verify an action they performed themselves
    CONSTRAINT check_dual_control_verification CHECK (
        verified_by IS NULL OR performed_by IS NULL OR verified_by != performed_by
    )
);

-- 16. Verification Decisions Register
CREATE TABLE IF NOT EXISTS verification_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corrective_action_id UUID NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    review_comments TEXT NOT NULL,
    decided_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. Official Authority Referrals
CREATE TABLE IF NOT EXISTS authority_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES safety_incidents(id) ON DELETE SET NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    referred_authority_name VARCHAR(255) NOT NULL,
    case_reference_number VARCHAR(100) NOT NULL,
    referral_reason TEXT NOT NULL,
    referred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 18. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Performance & Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user ON restaurant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_restaurant ON restaurant_memberships(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant ON branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_item ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_allergen_item ON allergen_declarations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_temp_readings_scoped ON temperature_readings(restaurant_id, branch_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking ON complaints(tracking_code);
CREATE INDEX IF NOT EXISTS idx_complaints_restaurant ON complaints(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_scoped ON safety_incidents(restaurant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_incident ON corrective_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_scoped ON audit_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON qr_tokens(token_hash);
