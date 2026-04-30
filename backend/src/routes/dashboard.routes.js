import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStats, getPipeline, getActivity, getChart } from '../controllers/dashboard.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/stats', getStats);
router.get('/pipeline', getPipeline);
router.get('/activity', getActivity);
router.get('/chart', getChart);

export default router;
