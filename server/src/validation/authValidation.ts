import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name required'),
  requestedRole: z
    .enum([
      'platform_admin',
      'restaurant_owner',
      'restaurant_manager',
      'supervisor',
      'kitchen_staff',
      'hygiene_staff',
      'customer',
      'external_authority',
    ])
    .optional(),
});
