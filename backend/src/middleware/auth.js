import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const employee = await prisma.employee.findUnique({
      where: { id: payload.id },
      select: { id: true, fullName: true, email: true, role: true, isActive: true, avatarUrl: true },
    });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = employee;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
