import prisma from '../config/db.js';
import { slugify } from '../utils/slug.js';
import { logActivity } from '../services/activity.service.js';

const projectInclude = {
  manager: { select: { id: true, fullName: true, avatarUrl: true } },
  members: { include: { employee: { select: { id: true, fullName: true, avatarUrl: true } } } },
  _count: { select: { tasks: true } },
};

export const index = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      include: projectInclude, orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) { next(err); }
};

export const show = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { ...projectInclude, tasks: { include: { status: true, assignees: { include: { employee: { select: { id: true, fullName: true, avatarUrl: true } } } } } } },
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { memberIds, ...data } = req.body;
    const slug = slugify(data.name);
    const project = await prisma.project.create({
      data: {
        ...data,
        slug,
        managerId: data.managerId ? parseInt(data.managerId) : req.user.id,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        members: memberIds ? { create: memberIds.map(employeeId => ({ employeeId: parseInt(employeeId) })) } : undefined,
      },
      include: projectInclude,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Project', entityId: project.id, action: 'created' });
    res.status(201).json(project);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const project = await prisma.project.update({
      where: { id }, data: req.body, include: projectInclude,
    });
    res.json(project);
  } catch (err) { next(err); }
};

export const addMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const { employeeId, role } = req.body;
    await prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId, employeeId: parseInt(employeeId) } },
      update: { role },
      create: { projectId, employeeId: parseInt(employeeId), role },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const removeMember = async (req, res, next) => {
  try {
    await prisma.projectMember.delete({
      where: { projectId_employeeId: { projectId: parseInt(req.params.id), employeeId: parseInt(req.params.employeeId) } },
    });
    res.status(204).end();
  } catch (err) { next(err); }
};
