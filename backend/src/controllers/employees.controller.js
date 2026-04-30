import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { logActivity } from '../services/activity.service.js';

const employeeSelect = {
  id: true, fullName: true, email: true, phone: true,
  role: true, designation: true, department: true, avatarUrl: true,
  isActive: true, joinedAt: true, lastLoginAt: true, createdAt: true,
  _count: { select: { assignedTasks: { where: { isArchived: false, status: { isDone: false } } } } },
};

export const index = async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      select: employeeSelect, orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (err) { next(err); }
};

export const show = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(req.params.id) }, select: employeeSelect,
    });
    if (!employee) return res.status(404).json({ error: 'Not found' });
    res.json(employee);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const employee = await prisma.employee.create({
      data: { ...data, passwordHash }, select: employeeSelect,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Employee', entityId: employee.id, action: 'created' });
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { password, ...data } = req.body;
    const updateData = { ...data };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.employee.update({
      where: { id }, data: updateData, select: employeeSelect,
    });
    res.json(employee);
  } catch (err) { next(err); }
};

export const deactivate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const employee = await prisma.employee.update({
      where: { id }, data: { isActive: false }, select: employeeSelect,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Employee', entityId: id, action: 'deactivated' });
    res.json(employee);
  } catch (err) { next(err); }
};

export const reactivate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const employee = await prisma.employee.update({
      where: { id }, data: { isActive: true }, select: employeeSelect,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Employee', entityId: id, action: 'reactivated' });
    res.json(employee);
  } catch (err) { next(err); }
};

export const uploadAvatar = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/avatars/${req.file.filename}` });
};

export const resetPassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.employee.update({ where: { id }, data: { passwordHash } });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
