import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as c from '../controllers/settings.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', c.getSettings);
router.patch('/', requireRole(['ADMIN']), c.updateSettings);

router.get('/lead-statuses', c.getLeadStatuses);
router.post('/lead-statuses', requireRole(['ADMIN']), c.createLeadStatus);
router.patch('/lead-statuses/reorder', requireRole(['ADMIN']), c.reorderLeadStatuses);
router.patch('/lead-statuses/:id', requireRole(['ADMIN']), c.updateLeadStatus);

router.get('/task-statuses', c.getTaskStatuses);
router.post('/task-statuses', requireRole(['ADMIN']), c.createTaskStatus);
router.patch('/task-statuses/reorder', requireRole(['ADMIN']), c.reorderTaskStatuses);
router.patch('/task-statuses/:id', requireRole(['ADMIN']), c.updateTaskStatus);

router.get('/categories', c.getCategories);
router.post('/categories', requireRole(['ADMIN']), c.createCategory);
router.patch('/categories/:id', requireRole(['ADMIN']), c.updateCategory);

router.get('/tags', c.getTags);
router.post('/tags', requireRole(['ADMIN']), c.createTag);
router.patch('/tags/:id', requireRole(['ADMIN']), c.updateTag);
router.delete('/tags/:id', requireRole(['ADMIN']), c.deleteTag);

export default router;
