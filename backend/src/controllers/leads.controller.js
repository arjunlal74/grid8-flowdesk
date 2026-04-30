import prisma from '../config/db.js';
import { logActivity } from '../services/activity.service.js';

const leadInclude = {
  status: true,
  category: true,
  owner: { select: { id: true, fullName: true, avatarUrl: true } },
  tags: { include: { tag: true } },
};

export const index = async (req, res, next) => {
  try {
    const { view = 'list', status, owner, priority, category, tag, search, page = 1, limit = 25 } = req.query;
    const where = { isArchived: false };
    if (status) where.statusId = parseInt(status);
    if (owner) where.ownerId = parseInt(owner);
    if (priority) where.priority = priority;
    if (category) where.categoryId = parseInt(category);
    if (search) where.OR = [
      { contactName: { contains: search } },
      { companyName: { contains: search } },
      { email: { contains: search } },
    ];
    if (req.user.role === 'MEMBER') where.ownerId = req.user.id;

    if (view === 'kanban') {
      const statuses = await prisma.leadStatus.findMany({
        where: { isActive: true }, orderBy: { order: 'asc' },
      });
      const columns = await Promise.all(statuses.map(async (s) => {
        const leads = await prisma.lead.findMany({
          where: { ...where, statusId: s.id },
          include: leadInclude,
          orderBy: { position: 'asc' },
        });
        return { ...s, leads };
      }));
      return res.json(columns);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({ where, include: leadInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    ]);
    res.json({ data: leads, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

export const show = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { ...leadInclude, tasks: { include: { status: true, assignee: { select: { id: true, fullName: true, avatarUrl: true } } } } },
    });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'MEMBER' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(lead);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { tagIds, ...data } = req.body;
    const lead = await prisma.lead.create({
      data: {
        ...data,
        ownerId: data.ownerId || req.user.id,
        tags: tagIds ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
      },
      include: leadInclude,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Lead', entityId: lead.id, action: 'created', leadId: lead.id });
    res.status(201).json(lead);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'MEMBER' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { tagIds, ...data } = req.body;
    const changes = {};
    if (data.statusId && data.statusId !== existing.statusId) {
      const [from, to] = await Promise.all([
        prisma.leadStatus.findUnique({ where: { id: existing.statusId } }),
        prisma.leadStatus.findUnique({ where: { id: data.statusId } }),
      ]);
      changes.status = { from: from?.name, to: to?.name };
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        tags: tagIds ? { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) } : undefined,
      },
      include: leadInclude,
    });

    if (Object.keys(changes).length > 0) {
      await logActivity({ actorId: req.user.id, entityType: 'Lead', entityId: id, action: 'updated', changes, leadId: id });
    }
    res.json(lead);
  } catch (err) { next(err); }
};

export const destroy = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.lead.delete({ where: { id } });
    await logActivity({ actorId: req.user.id, entityType: 'Lead', entityId: id, action: 'deleted' });
    res.status(204).end();
  } catch (err) { next(err); }
};

export const move = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { statusId, position } = req.body;
    const existing = await prisma.lead.findUnique({ where: { id } });

    const lead = await prisma.lead.update({
      where: { id },
      data: { statusId: parseInt(statusId), position: parseInt(position) },
      include: leadInclude,
    });

    if (existing.statusId !== parseInt(statusId)) {
      const [from, to] = await Promise.all([
        prisma.leadStatus.findUnique({ where: { id: existing.statusId } }),
        prisma.leadStatus.findUnique({ where: { id: parseInt(statusId) } }),
      ]);
      await logActivity({
        actorId: req.user.id, entityType: 'Lead', entityId: id,
        action: 'status_changed', changes: { status: { from: from?.name, to: to?.name } }, leadId: id,
      });
    }
    res.json(lead);
  } catch (err) { next(err); }
};

export const archive = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    const updated = await prisma.lead.update({
      where: { id }, data: { isArchived: !lead.isArchived }, include: leadInclude,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Lead', entityId: id, action: updated.isArchived ? 'archived' : 'restored', leadId: id });
    res.json(updated);
  } catch (err) { next(err); }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { leadId: parseInt(req.params.id) },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (err) { next(err); }
};

export const addComment = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id);
    const comment = await prisma.comment.create({
      data: { body: req.body.body, authorId: req.user.id, leadId },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    await logActivity({ actorId: req.user.id, entityType: 'Lead', entityId: leadId, action: 'commented', leadId });
    res.status(201).json(comment);
  } catch (err) { next(err); }
};

export const getActivity = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { leadId: parseInt(req.params.id) },
      include: { actor: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) { next(err); }
};
