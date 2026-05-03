import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as c from '../controllers/attendance.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/status', c.status);
router.get('/me', c.myHistory);
router.post('/check-in', c.checkIn);
router.post('/check-out', c.checkOut);

// Admin
router.get('/all', requireRole(['ADMIN']), c.allHistory);
router.get('/punches', requireRole(['ADMIN']), c.listPunches);
router.post('/admin', requireRole(['ADMIN']), c.adminCreate);
router.patch('/:id', requireRole(['ADMIN']), c.adminUpdate);
router.delete('/:id', requireRole(['ADMIN']), c.adminDelete);

export default router;
