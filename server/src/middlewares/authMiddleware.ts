import { Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest, UserRole } from '../types/auth.js';

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = AuthService.verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      fullName: payload.email.split('@')[0],
      isPlatformAdmin: payload.isPlatformAdmin,
      memberships: payload.memberships || [],
    };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or has expired.',
      },
    });
  }
}

/**
 * Enforces strict tenant scoping.
 * Never trusts a restaurant ID supplied by the client without verifying the user's membership.
 */
export function requireTenantScope(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  // Extract target restaurant ID from params, headers, or query
  const targetRestaurantId =
    (req.params.restaurantId as string) ||
    (req.headers['x-tenant-id'] as string) ||
    (req.query.restaurantId as string) ||
    (req.body && req.body.restaurantId as string);

  if (!targetRestaurantId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TENANT_ID',
        message: 'Target restaurant identifier is required (via X-Tenant-Id header, route parameter, or query).',
      },
    });
    return;
  }

  // Platform admins can audit across all tenants
  if (req.user.isPlatformAdmin) {
    req.activeRestaurantId = targetRestaurantId;
    req.activeRole = 'platform_admin';
    next();
    return;
  }

  // Check user's memberships for this exact restaurant
  const matchingMembership = req.user.memberships.find(
    (m) => m.restaurantId === targetRestaurantId
  );

  if (!matchingMembership) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: `Access Denied: You do not have an active staff or management role in restaurant ${targetRestaurantId}.`,
      },
    });
    return;
  }

  // Branch-level verification if requested in route
  const targetBranchId = req.params.branchId || (req.headers['x-branch-id'] as string);
  if (targetBranchId && matchingMembership.branchId && matchingMembership.branchId !== targetBranchId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'BRANCH_ACCESS_DENIED',
        message: `Access Denied: Your assignment does not grant access to branch ${targetBranchId}.`,
      },
    });
    return;
  }

  req.activeRestaurantId = targetRestaurantId;
  req.activeBranchId = matchingMembership.branchId || undefined;
  req.activeRole = matchingMembership.role;
  next();
}

/**
 * Checks role permissions.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (req.user.isPlatformAdmin) {
      next();
      return;
    }

    const hasRole =
      (req.activeRole && allowedRoles.includes(req.activeRole)) ||
      req.user.memberships.some((m) => allowedRoles.includes(m.role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(
            ', '
          )}].`,
        },
      });
      return;
    }

    next();
  };
}
