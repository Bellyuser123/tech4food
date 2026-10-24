import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Repository } from '../db/repository.js';
import {
  AuthenticatedUser,
  AuthTokenPayload,
  UserMembership,
  UserRole,
} from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'plateproof_secure_jwt_secret_token_default_key_2026';

export class AuthService {
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }

  public static async login(
    email: string,
    plainPassword: string
  ): Promise<{ token: string; user: AuthenticatedUser }> {
    const userRecord = await Repository.findUserByEmail(email);
    if (!userRecord) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await this.comparePassword(plainPassword, userRecord.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const memberships = await Repository.getUserMemberships(userRecord.id);

    const user: AuthenticatedUser = {
      id: userRecord.id,
      email: userRecord.email,
      fullName: userRecord.full_name,
      isPlatformAdmin: userRecord.is_platform_admin,
      memberships,
    };

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      memberships: user.memberships,
    });

    return { token, user };
  }

  public static async register(data: {
    email: string;
    password: string;
    fullName: string;
    requestedRole?: UserRole;
    callerUser?: AuthenticatedUser;
  }): Promise<{ user: AuthenticatedUser; token: string }> {
    const existing = await Repository.findUserByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    // ANTI-PRIVILEGE ESCALATION RULES:
    // 1. Cannot self-assign platform_admin unless caller is already a platform_admin
    // 2. Cannot self-assign supervisor or external_authority without elevated manager/admin privileges
    const restrictedRoles: UserRole[] = ['platform_admin', 'supervisor', 'external_authority'];
    if (data.requestedRole && restrictedRoles.includes(data.requestedRole)) {
      if (!data.callerUser?.isPlatformAdmin) {
        throw new Error(
          `Privilege Escalation Blocked: Role '${data.requestedRole}' cannot be self-assigned without administrative authorization.`
        );
      }
    }

    const passwordHash = await this.hashPassword(data.password);
    const newUserRecord = await Repository.createUser({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      isPlatformAdmin: data.callerUser?.isPlatformAdmin && data.requestedRole === 'platform_admin',
    });

    const user: AuthenticatedUser = {
      id: newUserRecord.id,
      email: newUserRecord.email,
      fullName: newUserRecord.full_name,
      isPlatformAdmin: newUserRecord.is_platform_admin,
      memberships: [],
    };

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      memberships: [],
    });

    return { user, token };
  }
}
