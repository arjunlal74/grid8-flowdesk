import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, subtaskCreateSchema, subtaskUpdateSchema } from '../validators/task.schema.js';
import * as c from '../controllers/tasks.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', c.index);
router.post('/', validate(createTaskSchema), c.create);
router.get('/:id', c.show);
router.patch('/:id', validate(updateTaskSchema), c.update);
router.delete('/:id', requireRole(['ADMIN']), c.destroy);
router.post('/:id/move', c.move);
router.post('/:id/complete', c.complete);
router.get('/:id/comments', c.getComments);
router.post('/:id/comments', c.addComment);

// Subtasks
router.post('/:id/subtasks', validate(subtaskCreateSchema), c.addSubtask);
router.patch('/:id/subtasks/:subtaskId', validate(subtaskUpdateSchema), c.updateSubtask);
router.delete('/:id/subtasks/:subtaskId', c.deleteSubtask);

export default router;
