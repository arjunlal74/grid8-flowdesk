import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { signToken } from '../utils/jwt.js';

const userSelect = {
  id: true, fullName: true, email: true, role: true,
  designation: true, avatarUrl: true, isActive: true,
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await prisma.employee.update({
      where: { id: employee.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({ id: employee.id, role: employee.role });
    const { passwordHash: _, ...user } = employee;
    res.json({ token, user });
  } catch (err) { next(err); }
};

export const me = async (req, res) => {
  res.json(req.user);
};
