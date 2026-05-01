import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  statusId: z.coerce.number().int().positive(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  projectId: z.coerce.number().int().positive().optional(),
  leadId: z.coerce.number().int().positive().optional(),
  assigneeIds: z.array(z.coerce.number().int().positive()).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  parentTaskId: z.coerce.number().int().positive().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();
