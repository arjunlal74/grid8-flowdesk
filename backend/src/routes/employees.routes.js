import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.schema.js';
import { uploadAvatar } from '../middleware/upload.js';
import * as c from '../controllers/employees.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/upload-avatar', uploadAvatar, c.uploadAvatar);
router.get('/', requireRole(['ADMIN','MANAGER']), c.index);
router.post('/', requireRole(['ADMIN']), validate(createEmployeeSchema), c.create);
router.get('/:id', requireRole(['ADMIN','MANAGER']), c.show);
router.patch('/:id', validate(updateEmployeeSchema), c.update);
router.post('/:id/deactivate', requireRole(['ADMIN']), c.deactivate);
router.post('/:id/reactivate', requireRole(['ADMIN']), c.reactivate);
router.post('/:id/reset-password', requireRole(['ADMIN']), c.resetPassword);

export default router;
