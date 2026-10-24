# PlateProof 360 🛡️🍽️

> **Mobile-first food safety and accountability web application connecting restaurant guests with transparent allergen & temperature data, and empowering kitchen teams with dual-control compliance workflows.**

---

## 📋 Architectural Overview

PlateProof 360 provides a multi-tenant platform for food safety transparency and incident management.

- **Customer-Facing Mobile Experience:**
  - QR-driven menu browsing with live preparation temperatures and declared allergen disclosures.
  - Opaque, private incident reporting and tracking (no mandatory account registration required).
  - Clear emergency guidance and statutory referral notices to official health authorities.
- **Restaurant Operational Control:**
  - Real-time Critical Control Point (CCP) cold-chain and hot-holding logging.
  - Incident intake, corrective action assignment, and tamper-evident audit trails.
  - **Enforced Dual-Control Rule:** A supervisor signing off on a corrective action must NOT be the user who executed that action.
- **Platform Integrity & Scoping:**
  - Strict tenant isolation by restaurant and branch.
  - Zero cross-tenant data leakage.
  - Non-forgeable demo data markers; internal checklists are never disguised as official government certifications.

---

## 🎨 Visual Identity & Design System

PlateProof 360 follows a warm, high-contrast culinary palette:
- **Primary Brand:** Deep Burgundy / Tomato Red (`#9E1B22` / `#82161C`)
- **Surfaces:** Warm White (`#FFFFFF`), Cream (`#FAF7F0`), Warm Tint (`#F5EFE3`)
- **Safety Accents:**
  - *Compliant / Verified:* Emerald Green (`#1E6B47`, `#E8F5EE`)
  - *Warning / Threshold Drift:* Warm Amber (`#B86800`, `#FEF7ED`)
  - *Critical / Allergen Alert:* Deep Burgundy (`#9E1B22`, `#FEECEB`)
- **Typography:** Display headings in *Outfit*, UI body text in *Plus Jakarta Sans*.
- **Touch-First Accessibility:** Minimum 44px touch targets on mobile viewports.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite | Fast, responsive, accessible mobile-first UI |
| **Icons** | Lucide React | Consistent culinary and safety iconography |
| **Backend** | Node.js (v24+), Express, TypeScript, Zod | Type-safe REST API with tenant scoping |
| **Database** | PostgreSQL, pg connection pool | Normalized multi-tenant schema with migrations |
| **Testing** | Vitest, Supertest | Unit & integration diagnostics testing |

---

## 📂 Repository Structure

```
sharp-oppenheimer/
├── client/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/common/  # Design system (Logo, Button, Card, Input, Badge, Modal, Toast, Navigation, ApiHealthBadge)
│   │   ├── data/               # Realistic demo mock data & CCP logs
│   │   ├── pages/              # RestaurantProfilePage, MenuPage, CustomerComplaintPage, DashboardPage, LoginPage
│   │   ├── services/           # ApiService client & health check
│   │   ├── types/              # Shared frontend TypeScript interfaces
│   │   ├── App.tsx             # Root application & routing
│   │   ├── main.tsx            # React DOM mounting
│   │   └── index.css           # Tailwind directives & custom scrollbars
│   ├── tailwind.config.js      # PlateProof color tokens & typography
│   ├── vite.config.ts          # Vite configuration with API proxy
│   └── package.json
│
├── server/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # Environment validation (Zod) & pg Pool
│   │   ├── db/                 # PostgreSQL migrations runner & SQL schemas
│   │   │   └── migrations/     # 001_initial_schema.sql (multi-tenant baseline)
│   │   ├── controllers/        # HealthController
│   │   ├── services/           # HealthService
│   │   ├── routes/             # healthRouter, apiRouter
│   │   ├── middlewares/        # errorHandler, requestLogger, tenantScope
│   │   ├── validation/         # Zod schemas for request/response
│   │   ├── app.ts              # Express factory with helmet, cors, json
│   │   ├── index.ts            # Entrypoint listener
│   │   └── tests/              # Vitest test suites (health & diagnostics)
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example                # Canonical environment variable template
├── .gitignore                  # Clean repository ignore rules
├── package.json                # Root workflow scripts
└── README.md
```

---

## 🚀 Setup & Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v24.15.0 tested)
- **npm**: v9.0.0 or later

### 2. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or individually: `cd server && npm install` and `cd client && npm install`)*

### 3. Environment Configuration
Copy `.env.example` to `.env` in the server directory (or root):
```bash
cp .env.example server/.env
```
*(The default configuration uses port `5000` for the API and `5173` for Vite with graceful fallback if PostgreSQL is not running immediately.)*

### 4. Running the Development Servers

**Run Backend API:**
```bash
npm run dev:server
```
API runs on `http://localhost:5000`.

**Run Frontend Client:**
```bash
npm run dev:client
```
Client runs on `http://localhost:5173` with automated API proxying.

### 5. Type Checking & Testing

```bash
# Type check both frontend and backend
npm run type-check

# Run automated tests
npm run test

# Production build
npm run build
```

---

## 📡 API Health & Diagnostics

The API provides standardized health and diagnostic endpoints:
- `GET /api/v1/health`: Returns API state, uptime, version, and database connectivity.
- `GET /api/v1/ping`: Instant round-trip connectivity check.

Example response from `GET /api/v1/health`:
```json
{
  "success": true,
  "data": {
    "status": "degraded",
    "service": "PlateProof 360 REST API",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-10-24T00:30:00.000Z",
    "uptimeSeconds": 142,
    "database": {
      "status": "disconnected",
      "latencyMs": 3001,
      "message": "Database unreachable: connect ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```
*(Note: When PostgreSQL is active, `status` returns `"ok"` and `database.status` returns `"connected"` with latency in milliseconds).*

---

## 🔐 Authentication, Personas & RBAC (Phase 3)

### Demo Personas & Credentials
All demo personas are seeded with password: `PlateProof2026!Demo`

| Persona | Role | Email | Scope |
| :--- | :--- | :--- | :--- |
| **Platform Auditor** | `platform_admin` | `admin@plateproof360.internal` | Global platform administration & official verification |
| **Elena Rossi** | `restaurant_manager` | `elena.manager@osteriaspina.demo` | Osteria Della Spina (all branches) |
| **Marco Santoro** | `supervisor` | `marco.supervisor@osteriaspina.demo` | Osteria Della Spina &bull; Branch 01 |
| **Leo Donati** | `kitchen_staff` | `leo.cook@osteriaspina.demo` | Osteria Della Spina &bull; Branch 01 |
| **Clara Neri** | `hygiene_staff` | `clara.hygiene@osteriaspina.demo` | Osteria Della Spina &bull; Branch 01 |
| **Sophia Bellini** | Multi-Tenant | `sophia.multi@culinarygroup.demo` | Manager at Osteria Della Spina, Kitchen Staff at Trattoria Al Sole |

### Security & Privilege Invariants
1. **Tenant Isolation:** A user belonging to Restaurant A cannot query or mutate private records of Restaurant B (`CROSS_TENANT_ACCESS_DENIED`).
2. **Anti-Self-Verification:** A restaurant owner or manager cannot mark their restaurant as officially verified (`SELF_VERIFICATION_PROHIBITED`). Only Platform Administrators can alter verification status.
3. **Dual-Control Verification:** A supervisor verifying a corrective action cannot be the staff member who performed that action (`DUAL_CONTROL_VIOLATION`).
4. **Anti-Privilege Escalation:** Unauthenticated registrations cannot request `platform_admin` or `supervisor` roles (`PRIVILEGE_ESCALATION_DENIED`).
5. **Rate Limiting:** Brute-force protection on authentication endpoints with `Retry-After` HTTP headers.

---

## 🗄️ Database Architecture & Migrations (Phase 2)

Normalized PostgreSQL schema located at `server/src/db/migrations/001_full_schema.sql`:
- `users`: Core credentials and platform administration flags.
- `restaurants` & `branches`: Multi-tenant hierarchy with configurable HACCP temperature thresholds.
- `restaurant_memberships`: Scoped role assignments allowing users to participate across multiple restaurants and branches.
- `menu_categories` & `menu_items`: Food offerings with dietary tags.
- `ingredients`, `menu_item_ingredients`, `allergen_declarations`: Transparent allergen matrices and recipe linkages.
- `orders` & `order_items`: Consumer order records.
- `qr_tokens`: Opaque, cryptographically signed, revocable tokens (no PII in QR parameters).
- `hygiene_inspections` & `inspection_checklist_results`: Internal hygiene audits.
- `temperature_readings` & `batch_expiry_records`: Real-time cold-chain & hot-holding logs.
- `complaints` & `complaint_evidence`: Anonymous customer intake with private tracking codes (`PP360-XXXXXX`).
- `safety_incidents` & `corrective_actions`: Incident management with dual-control constraint.
- `verification_decisions`: Immutable sign-off decisions with supervisor remarks.
- `authority_referrals`: Official municipal referral records.
- `audit_events`: Append-only, immutable event log for consequential state changes.

---

## 🧪 Automated & Manual Test Checklist

### Automated Test Suite (17 Passing Tests)
Run from root:
```bash
npm run test
```
- ✅ **Health & Ping Diagnostics (4 tests):** Root banner, `/api/v1/ping`, `/api/v1/health` with DB status and degraded mode, 404 handler.
- ✅ **Authentication & Tenant Isolation (9 tests):**
  - Unauthenticated access returns 401.
  - Invalid credentials return safe error without stack traces or secrets.
  - Successful login returns JWT token and scoped restaurant memberships.
  - Cross-tenant access rejection (switching restaurant ID in URL returns 403).
  - Multi-tenant staff access with distinct roles across different restaurants.
  - Anti-privilege escalation blocks self-assigning platform_admin/supervisor.
  - Restaurant account cannot self-verify official certification.
  - Platform administrator successfully verifies restaurant.
  - Enforced dual-control rule: supervisor cannot verify corrective action they performed.
- ✅ **Design System Component Rendering (4 tests):** Logo, Button variants, Badge variants, Card layout.

### Manual Verification Checklist
1. **API Health Badge:**
   - Open frontend at `http://localhost:5173`.
   - Observe the live pill in the top header displaying API status.
   - Click the badge to inspect latency, service name, and PostgreSQL pool connectivity.
2. **Consumer QR Menu & Allergen Filter:**
   - Navigate to "Menu & Safety" tab.
   - Click category pills ("Handmade Pasta", "Wood-Fired Mains", etc.) to filter dishes.
   - Click "Without Gluten" or "Without Dairy" in the allergen filter toolbar to confirm real-time dish exclusion.
   - Click any dish card to view the HACCP temperature log modal and declared allergen breakdown.
3. **Anonymous Incident Intake & Tracking:**
   - Navigate to "Report Issue" tab.
   - Select symptom checkboxes (e.g. Nausea, Oral Tingling), fill in description, and click "Submit Incident Report Privately".
   - Confirm receipt of private tracking code (e.g., `PP360-XXXXXX`).
   - Switch to the "Track Existing Report" tab and enter the code to inspect investigation status.
4. **Staff Operations Dashboard:**
   - Navigate to "Dashboard" tab.
   - View real-time Critical Control Point (CCP) cold-chain sensors.
   - Check the "Corrective Actions" tab displaying dual-control verification requirements.
   - Switch to "Immutable Audit" to see tamper-evident event history.
5. **Mobile Responsiveness:**
   - Resize browser to 375px width (iPhone standard).
   - Verify bottom thumb navigation bar appears and functions smoothly without horizontal scrollbars or clipping.

#   t e c h 4 f o o d  
 