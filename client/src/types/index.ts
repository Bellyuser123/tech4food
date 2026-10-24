export interface DatabaseHealthInfo {
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  message?: string;
}

export interface ApiHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  database: DatabaseHealthInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BranchInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
}

export interface RestaurantVerificationInfo {
  isVerified: boolean;
  verifiedAt?: string | null;
  verificationSource?: string | null;
  officialRegistrationId: string;
  isOfficialAuthorityVerified: boolean;
  disclaimer: string;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  address: string;
  phone: string;
  rating?: number;
  hygieneScore?: string;
  lastInspectionDate?: string;
  officialLicense?: string;
  logoUrl?: string;
  bannerUrl?: string;
  openingHours?: string;
  activeIncidentsCount?: number;
  resolvedComplaintsRate?: string;
  branches?: BranchInfo[];
  verification?: RestaurantVerificationInfo;
}

export interface StructuredAllergen {
  allergen_code: string;
  status: 'contains' | 'may_contain' | 'free_from' | 'not_provided';
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  allergens: string[];
  dietaryTags: string[];
  isAvailable?: boolean;
  prepTemperature?: string;
  temperatureLoggedAt?: string;
  isPopular?: boolean;
  ingredients?: string[];
  structuredAllergens?: StructuredAllergen[];
  hasUnverifiedAllergens?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface PublicMenuResponse {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    address: string;
    phone: string;
    is_verified: boolean;
    verification_source?: string;
    verified_at?: string;
  };
  allergyCautionNotice: string;
  categories: MenuCategory[];
  items: Array<{
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
    allergens: StructuredAllergen[];
    has_unverified_allergens: boolean;
  }>;
}

export interface ComplaintSubmission {
  restaurantId: string;
  branchName?: string;
  allegationType: 'food_poisoning' | 'foreign_object' | 'allergen_mishap' | 'temperature_abuse' | 'hygiene_violation' | 'other';
  symptoms: string[];
  description: string;
  orderReference?: string;
  incidentDateTime: string;
  contactEmailOrPhone?: string;
  evidenceNotes?: string;
}

export interface OrderItemCustomerView {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_allergen_notes?: string;
  ingredients: string[];
  allergens: StructuredAllergen[];
  has_unverified_allergens: boolean;
}

export interface OrderSafetyCheckView {
  check_type: string;
  reading_or_status: string;
  target_threshold: string;
  is_safe: boolean;
  logged_at: string;
  logged_by_role: string;
}

export interface CustomerOrderView {
  orderId: string;
  orderReference: string;
  tableNumber: string;
  status: 'placed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  placedAt: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    address: string;
    phone: string;
    is_verified: boolean;
    verification_source?: string;
  } | null;
  branch: {
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
  } | null;
  items: OrderItemCustomerView[];
  safetyChecks: OrderSafetyCheckView[];
  complaintFilingUrl: string;
  allergyAdvisoryNotice: string;
}

export interface TableQrRecord {
  id: string;
  restaurantId: string;
  branchId: string;
  tableNumber: string;
  tokenHash: string;
  rawTokenPreview?: string;
  isRevoked: boolean;
  createdAt: string;
  deepLinkUrl: string;
  qrDataUrl: string;
  qrSvg: string;
  printableStationCardHtml?: string;
}

export interface QrResolutionResult {
  type: 'table' | 'order';
  restaurantId?: string;
  branchId?: string;
  tableNumber?: string;
  restaurant?: RestaurantProfile | null;
  branch?: { id: string; name: string; code: string; address: string; phone: string } | null;
  redirectPath?: string;
  order?: CustomerOrderView;
}

