import prisma from '../config/db.js';
import { slugify } from '../utils/slug.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });
    res.json(settings);
  } catch (err) { next(err); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await prisma.appSetting.update({ where: { id: 1 }, data: req.body });
    res.json(settings);
  } catch (err) { next(err); }
};

// ── Lead Statuses ────────────────────────────────────────────

export const getLeadStatuses = async (req, res, next) => {
  try {
    res.json(await prisma.leadStatus.findMany({ orderBy: { order: 'asc' } }));
  } catch (err) { next(err); }
};

export const createLeadStatus = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    res.status(201).json(await prisma.leadStatus.create({ data: { name, slug: slugify(name), ...rest } }));
  } catch (err) { next(err); }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    res.json(await prisma.leadStatus.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const reorderLeadStatuses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Promise.all(ids.map((id, order) => prisma.leadStatus.update({ where: { id }, data: { order } })));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ── Task Statuses ────────────────────────────────────────────

export const getTaskStatuses = async (req, res, next) => {
  try {
    res.json(await prisma.taskStatus.findMany({ orderBy: { order: 'asc' } }));
  } catch (err) { next(err); }
};

export const createTaskStatus = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    res.status(201).json(await prisma.taskStatus.create({ data: { name, slug: slugify(name), ...rest } }));
  } catch (err) { next(err); }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    res.json(await prisma.taskStatus.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const reorderTaskStatuses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Promise.all(ids.map((id, order) => prisma.taskStatus.update({ where: { id }, data: { order } })));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ── Categories ───────────────────────────────────────────────

export const getCategories = async (req, res, next) => {
  try {
    res.json(await prisma.leadCategory.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    }));
  } catch (err) { next(err); }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    res.status(201).json(await prisma.leadCategory.create({ data: { name, slug: slugify(name), ...rest } }));
  } catch (err) { next(err); }
};

export const updateCategory = async (req, res, next) => {
  try {
    res.json(await prisma.leadCategory.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

// ── Tags ─────────────────────────────────────────────────────

export const getTags = async (req, res, next) => {
  try {
    res.json(await prisma.tag.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) { next(err); }
};

export const createTag = async (req, res, next) => {
  try {
    res.status(201).json(await prisma.tag.create({ data: req.body }));
  } catch (err) { next(err); }
};

export const updateTag = async (req, res, next) => {
  try {
    res.json(await prisma.tag.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteTag = async (req, res, next) => {
  try {
    await prisma.tag.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) { next(err); }
};
