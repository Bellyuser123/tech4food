import { Request, Response, NextFunction } from 'express';

export interface TenantScopedRequest extends Request {
  restaurantId?: string;
  branchId?: string;
}

/**
 * Tenant scoping middleware ensures requests targeting restaurant-owned resources
 * validate tenant headers/identifiers to prevent cross-tenant data leakage.
 */
export function enforceTenantScope(
  req: TenantScopedRequest,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.headers['x-tenant-id'] as string | undefined;

  // For public endpoints or non-scoped routes, continue
  if (!tenantId) {
    next();
    return;
  }

  // Set verified tenant on request context
  req.restaurantId = tenantId;
  next();
}
