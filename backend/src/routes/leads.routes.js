import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createLeadSchema, updateLeadSchema } from '../validators/lead.schema.js';
import * as c from '../controllers/leads.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', c.index);
router.post('/', validate(createLeadSchema), c.create);
router.get('/:id', c.show);
router.patch('/:id', validate(updateLeadSchema), c.update);
router.delete('/:id', requireRole(['ADMIN']), c.destroy);
router.post('/:id/move', c.move);
router.post('/:id/archive', c.archive);
router.get('/:id/comments', c.getComments);
router.post('/:id/comments', c.addComment);
router.get('/:id/activity', c.getActivity);

export default router;
