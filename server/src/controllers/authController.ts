import { Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { loginSchema, registerSchema } from '../validation/authValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class AuthController {
  public static async login(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid login payload',
            details: parsed.error.issues,
          },
        });
        return;
      }

      const { token, user } = await AuthService.login(parsed.data.email, parsed.data.password);
      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isPlatformAdmin: user.isPlatformAdmin,
            memberships: user.memberships,
          },
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message,
        },
      });
    }
  }

  public static async register(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration payload',
            details: parsed.error.issues,
          },
        });
        return;
      }

      const { user, token } = await AuthService.register({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.fullName,
        requestedRole: parsed.data.requestedRole,
        callerUser: req.user,
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      const statusCode = message.includes('Privilege Escalation Blocked') ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 403 ? 'PRIVILEGE_ESCALATION_DENIED' : 'REGISTRATION_ERROR',
          message,
        },
      });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}
