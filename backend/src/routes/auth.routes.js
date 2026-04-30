import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: 'Too many login attempts' } });

router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);

export default router;
