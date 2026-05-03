import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStats, getPipeline, getActivity, getChart, getMyDashboard } from '../controllers/dashboard.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/stats', getStats);
router.get('/pipeline', getPipeline);
router.get('/activity', getActivity);
router.get('/chart', getChart);
router.get('/me', getMyDashboard);

export default router;
