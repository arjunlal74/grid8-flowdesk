import { z } from 'zod';

export const createLeadSchema = z.object({
  contactName: z.string().min(1).max(120),
  companyName: z.string().max(160).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  country: z.string().max(80).optional().default('India'),
  categoryId: z.coerce.number().int().positive().optional(),
  source: z.enum(['REFERRAL','COLD_CALL','COLD_EMAIL','WHATSAPP','LINKEDIN','INSTAGRAM','WEBSITE','EVENT','WALK_IN','OTHER']).default('OTHER'),
  sourceDetail: z.string().max(200).optional(),
  statusId: z.coerce.number().int().positive(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  estimatedValue: z.coerce.number().nonnegative().optional(),
  currency: z.string().max(10).optional().default('INR'),
  expectedCloseAt: z.coerce.date().optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
  tagIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();
