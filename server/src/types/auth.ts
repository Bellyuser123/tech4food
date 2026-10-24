import { Request } from 'express';

export type UserRole =
  | 'platform_admin'
  | 'restaurant_owner'
  | 'restaurant_manager'
  | 'supervisor'
  | 'kitchen_staff'
  | 'hygiene_staff'
  | 'customer'
  | 'external_authority';

export interface UserMembership {
  restaurantId: string;
  branchId: string | null;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  memberships: UserMembership[];
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
  memberships: UserMembership[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  activeRestaurantId?: string;
  activeBranchId?: string;
  activeRole?: UserRole;
}
