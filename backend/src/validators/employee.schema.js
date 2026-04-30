import { z } from 'zod';

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/, 'Must include letter and number'),
  phone: z.string().max(40).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  role: z.enum(['ADMIN','MANAGER','MEMBER']).default('MEMBER'),
  joinedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
  avatarUrl: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.omit({ password: true }).partial().extend({
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/).optional(),
});
