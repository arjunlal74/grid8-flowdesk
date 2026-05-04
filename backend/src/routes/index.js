import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import leadsRoutes from './leads.routes.js';
import tasksRoutes from './tasks.routes.js';
import projectsRoutes from './projects.routes.js';
import employeesRoutes from './employees.routes.js';
import settingsRoutes from './settings.routes.js';
import attendanceRoutes from './attendance.routes.js';
import notesRoutes from './notes.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/leads', leadsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/projects', projectsRoutes);
router.use('/employees', employeesRoutes);
router.use('/settings', settingsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/notes', notesRoutes);

export default router;
