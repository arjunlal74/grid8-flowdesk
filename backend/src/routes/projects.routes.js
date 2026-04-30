import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as c from '../controllers/projects.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', c.index);
router.post('/', requireRole(['ADMIN','MANAGER']), c.create);
router.get('/:id', c.show);
router.patch('/:id', requireRole(['ADMIN','MANAGER']), c.update);
router.post('/:id/members', requireRole(['ADMIN','MANAGER']), c.addMember);
router.delete('/:id/members/:employeeId', requireRole(['ADMIN','MANAGER']), c.removeMember);

export default router;
