import { z } from 'zod';

const noteItemSchema = z.object({
  id: z.number().int().positive().optional(),
  text: z.string().min(1).max(500),
  isDone: z.boolean().default(false),
  position: z.number().int().default(0),
});

export const createNoteSchema = z.object({
  type: z.enum(['NOTE', 'CHECKLIST']),
  title: z.string().max(255).optional(),
  body: z.string().optional(),
  color: z.string().max(50).optional().nullable(),
  items: z.array(noteItemSchema).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  body: z.string().optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  items: z.array(noteItemSchema).optional(),
});
