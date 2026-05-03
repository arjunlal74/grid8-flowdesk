import prisma from '../config/db.js';
import { logActivity } from '../services/activity.service.js';

const subtaskAssigneeSelect = {
  include: { employee: { select: { id: true, fullName: true, avatarUrl: true } } },
};

const taskInclude = {
  status: true,
  project: { select: { id: true, name: true, color: true } },
  assignees: { include: { employee: { select: { id: true, fullName: true, avatarUrl: true } } } },
  creator: { select: { id: true, fullName: true, avatarUrl: true } },
  lead: { select: { id: true, contactName: true } },
  subtasks: {
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { assignees: subtaskAssigneeSelect },
  },
};

async function assertAssigneesBelongToProject(projectId, assigneeIds) {
  if (!projectId || !assigneeIds || assigneeIds.length === 0) return null;
  const pid = parseInt(projectId);
  const project = await prisma.project.findUnique({
    where: { id: pid },
    select: { managerId: true, members: { select: { employeeId: true } } },
  });
  if (!project) return 'Project not found';
  const allowed = new Set(project.members.map(m => m.employeeId));
  if (project.managerId) allowed.add(project.managerId);
  const invalid = assigneeIds
    .map(id => parseInt(id))
    .filter(id => !allowed.has(id));
  if (invalid.length > 0) {
    return `Assignees must belong to the project: ${invalid.join(', ')}`;
  }
  return null;
}

export const index = async (req, res, next) => {
  try {
    const { view = 'list', project, assignee, priority, search, page = 1, limit = 25 } = req.query;
    const where = { isArchived: false };
    if (project) where.projectId = parseInt(project);
    if (assignee) where.assignees = { some: { employeeId: parseInt(assignee) } };
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search };
    if (req.user.role === 'MEMBER') {
      where.OR = [
        { assignees: { some: { employeeId: req.user.id } } },
        { creatorId: req.user.id },
      ];
    }

    if (view === 'kanban') {
      const statuses = await prisma.taskStatus.findMany({
        where: { isActive: true }, orderBy: { order: 'asc' },
      });
      const columns = await Promise.all(statuses.map(async (s) => {
        const tasks = await prisma.task.findMany({
          where: { ...where, statusId: s.id },
          include: taskInclude,
          orderBy: { position: 'asc' },
        });
        return { ...s, tasks };
      }));
      return res.json(columns);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({ where, include: taskInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    ]);
    res.json({ data: tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

export const show = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { ...taskInclude, attachments: true },
    });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { assigneeIds, ...rest } = req.body;
    if (!rest.projectId) return res.status(400).json({ error: 'Project is required' });
    if (!assigneeIds || assigneeIds.length === 0) {
      return res.status(400).json({ error: 'At least one assignee is required' });
    }
    const ids = assigneeIds;
    const validationError = await assertAssigneesBelongToProject(rest.projectId, ids);
    if (validationError) return res.status(400).json({ error: validationError });
    const task = await prisma.task.create({
      data: {
        ...rest,
        creatorId: req.user.id,
        assignees: { create: ids.map(employeeId => ({ employeeId: parseInt(employeeId) })) },
      },
      include: taskInclude,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Task', entityId: task.id, action: 'created', taskId: task.id });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { assignees: { select: { employeeId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { assigneeIds, ...rest } = req.body;

    const effectiveProjectId = rest.projectId !== undefined ? rest.projectId : existing.projectId;
    if (!effectiveProjectId) return res.status(400).json({ error: 'Project is required' });
    const effectiveAssigneeIds = assigneeIds !== undefined
      ? assigneeIds
      : existing.assignees.map(a => a.employeeId);
    if (!effectiveAssigneeIds || effectiveAssigneeIds.length === 0) {
      return res.status(400).json({ error: 'At least one assignee is required' });
    }
    const validationError = await assertAssigneesBelongToProject(effectiveProjectId, effectiveAssigneeIds);
    if (validationError) return res.status(400).json({ error: validationError });

    const changes = {};
    if (rest.statusId && rest.statusId !== existing.statusId) {
      const [from, to] = await Promise.all([
        prisma.taskStatus.findUnique({ where: { id: existing.statusId } }),
        prisma.taskStatus.findUnique({ where: { id: rest.statusId } }),
      ]);
      changes.status = { from: from?.name, to: to?.name };
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            create: assigneeIds.map(employeeId => ({ employeeId: parseInt(employeeId) })),
          },
        }),
      },
      include: taskInclude,
    });

    if (Object.keys(changes).length > 0) {
      await logActivity({ actorId: req.user.id, entityType: 'Task', entityId: id, action: 'updated', changes, taskId: id });
    }
    res.json(task);
  } catch (err) { next(err); }
};

export const destroy = async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) { next(err); }
};

export const move = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { statusId, position } = req.body;
    const existing = await prisma.task.findUnique({ where: { id } });
    const task = await prisma.task.update({
      where: { id },
      data: { statusId: parseInt(statusId), position: parseInt(position) },
      include: taskInclude,
    });
    if (existing.statusId !== parseInt(statusId)) {
      const [from, to] = await Promise.all([
        prisma.taskStatus.findUnique({ where: { id: existing.statusId } }),
        prisma.taskStatus.findUnique({ where: { id: parseInt(statusId) } }),
      ]);
      await logActivity({ actorId: req.user.id, entityType: 'Task', entityId: id, action: 'status_changed', changes: { status: { from: from?.name, to: to?.name } }, taskId: id });
    }
    res.json(task);
  } catch (err) { next(err); }
};

export const complete = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const doneStatus = await prisma.taskStatus.findFirst({ where: { isDone: true } });
    const task = await prisma.task.update({
      where: { id },
      data: { statusId: doneStatus.id, completedAt: new Date() },
      include: taskInclude,
    });
    await logActivity({ actorId: req.user.id, entityType: 'Task', entityId: id, action: 'completed', taskId: id });
    res.json(task);
  } catch (err) { next(err); }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: parseInt(req.params.id) },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (err) { next(err); }
};

export const addComment = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const comment = await prisma.comment.create({
      data: { body: req.body.body, authorId: req.user.id, taskId },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    await logActivity({ actorId: req.user.id, entityType: 'Task', entityId: taskId, action: 'commented', taskId });
    res.status(201).json(comment);
  } catch (err) { next(err); }
};

// ---------- Subtasks ----------

export const addSubtask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, assigneeIds = [] } = req.body;

    const last = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title,
        position,
        assignees: assigneeIds.length ? { create: assigneeIds.map((employeeId) => ({ employeeId })) } : undefined,
      },
      include: { assignees: subtaskAssigneeSelect },
    });
    res.status(201).json(subtask);
  } catch (err) { next(err); }
};

export const updateSubtask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.subtaskId);
    const { title, isDone, assigneeIds } = req.body;

    const data = {};
    if (typeof title === 'string') data.title = title;
    if (typeof isDone === 'boolean') {
      data.isDone = isDone;
      data.completedAt = isDone ? new Date() : null;
    }
    if (Array.isArray(assigneeIds)) {
      data.assignees = {
        deleteMany: {},
        create: assigneeIds.map((employeeId) => ({ employeeId })),
      };
    }

    const subtask = await prisma.subtask.update({
      where: { id },
      data,
      include: { assignees: subtaskAssigneeSelect },
    });
    res.json(subtask);
  } catch (err) { next(err); }
};

export const deleteSubtask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.subtaskId);
    await prisma.subtask.delete({ where: { id } });
    res.status(204).end();
  } catch (err) { next(err); }
};
