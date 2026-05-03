import prisma from '../config/db.js';

const getRangeFilter = (range) => {
  const now = new Date();
  const start = new Date();
  const prevStart = new Date();
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(prevStart.getDate() - 1); prevStart.setHours(0, 0, 0, 0);
      return { start, prevStart, prevEnd: start };
    case 'yesterday':
      start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      prevStart.setDate(prevStart.getDate() - 2); prevStart.setHours(0, 0, 0, 0);
      return { start, end, prevStart, prevEnd: start };
    case '30d':
      start.setDate(start.getDate() - 30);
      prevStart.setDate(prevStart.getDate() - 60);
      return { start, prevStart, prevEnd: start };
    case '12m':
      start.setMonth(start.getMonth() - 12);
      prevStart.setMonth(prevStart.getMonth() - 24);
      return { start, prevStart, prevEnd: start };
    default: // 7d
      start.setDate(start.getDate() - 7);
      prevStart.setDate(prevStart.getDate() - 14);
      return { start, prevStart, prevEnd: start };
  }
};

export const getStats = async (req, res, next) => {
  try {
    const { range = '7d' } = req.query;
    const { start, end = new Date(), prevStart, prevEnd } = getRangeFilter(range);

    const [newLeads, prevLeads, wonLeads, lostLeads, openTasks, completedTasks] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: start, lte: end }, isArchived: false } }),
      prisma.lead.count({ where: { createdAt: { gte: prevStart, lte: prevEnd }, isArchived: false } }),
      prisma.lead.count({ where: { createdAt: { gte: start, lte: end }, status: { isWon: true } } }),
      prisma.lead.count({ where: { createdAt: { gte: start, lte: end }, status: { isLost: true } } }),
      prisma.task.count({ where: { isArchived: false, status: { isDone: false } } }),
      prisma.task.count({ where: { completedAt: { gte: start, lte: end } } }),
    ]);

    const closedLeads = wonLeads + lostLeads;
    const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
    const leadsDelta = prevLeads > 0 ? Math.round(((newLeads - prevLeads) / prevLeads) * 100) : 0;

    res.json({ newLeads, leadsDelta, conversionRate, openTasks, completedTasks });
  } catch (err) { next(err); }
};

export const getPipeline = async (req, res, next) => {
  try {
    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { _count: { select: { leads: { where: { isArchived: false } } } } },
    });

    const rows = await Promise.all(statuses.map(async (s) => {
      const agg = await prisma.lead.aggregate({
        where: { statusId: s.id, isArchived: false },
        _sum: { estimatedValue: true },
      });
      return {
        id: s.id, name: s.name, color: s.color,
        count: s._count.leads,
        value: Number(agg._sum.estimatedValue || 0),
      };
    }));

    const total = rows.reduce((a, r) => a + r.count, 0);
    res.json(rows.map(r => ({ ...r, percentage: total > 0 ? Math.round((r.count / total) * 100) : 0 })));
  } catch (err) { next(err); }
};

export const getActivity = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    res.json(logs);
  } catch (err) { next(err); }
};

// Employee personal dashboard
export const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    // Week starts Monday
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - dow);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

    const [todayTasks, activeProjects, weekPunches, priorityTasks, myProjects] = await Promise.all([
      prisma.task.count({
        where: {
          isArchived: false,
          status: { isDone: false },
          assignees: { some: { employeeId: userId } },
        },
      }),
      prisma.project.count({
        where: {
          status: 'ACTIVE',
          OR: [{ managerId: userId }, { members: { some: { employeeId: userId } } }],
        },
      }),
      prisma.attendancePunch.findMany({
        where: { employeeId: userId, checkInAt: { gte: weekStart, lt: weekEnd } },
        orderBy: { checkInAt: 'asc' },
      }),
      prisma.task.findMany({
        where: {
          isArchived: false,
          status: { isDone: false },
          assignees: { some: { employeeId: userId } },
        },
        include: {
          status: true,
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 6,
      }),
      prisma.project.findMany({
        where: {
          status: { in: ['ACTIVE', 'PLANNING'] },
          OR: [{ managerId: userId }, { members: { some: { employeeId: userId } } }],
        },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { status: { select: { isDone: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    // Weekly activity: hours per day Mon-Sun
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      return { date: d, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), minutes: 0 };
    });
    for (const p of weekPunches) {
      if (!p.checkOutAt) continue;
      const inDay = new Date(p.checkInAt); inDay.setHours(0, 0, 0, 0);
      const idx = Math.floor((inDay - weekStart) / 86400000);
      if (idx < 0 || idx > 6) continue;
      const sameDay = inDay.getTime() === new Date(p.checkOutAt).setHours(0, 0, 0, 0);
      if (sameDay) {
        weekDays[idx].minutes += Math.max(0, Math.round((new Date(p.checkOutAt) - new Date(p.checkInAt)) / 60000));
      } else {
        const endOfInDay = new Date(inDay); endOfInDay.setHours(23, 59, 59, 999);
        weekDays[idx].minutes += Math.max(0, Math.round((endOfInDay - new Date(p.checkInAt)) / 60000));
      }
    }
    const weeklyActivity = weekDays.map(d => ({ label: d.label, hours: +(d.minutes / 60).toFixed(1) }));
    const weeklyHours = +(weekDays.reduce((s, d) => s + d.minutes, 0) / 60).toFixed(1);

    const recentProjects = myProjects.map(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.status?.isDone).length;
      return {
        id: p.id, name: p.name, color: p.color, status: p.status, endDate: p.endDate,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    res.json({
      todayTasks,
      activeProjects,
      weeklyHours,
      weeklyActivity,
      priorityTasks: priorityTasks.map(t => ({
        id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate,
        status: t.status, project: t.project,
      })),
      recentProjects,
    });
  } catch (err) { next(err); }
};

export const getChart = async (req, res, next) => {
  try {
    const { metric = 'leads', range = '7d' } = req.query;
    const { start } = getRangeFilter(range);

    let data = [];
    if (metric === 'leads') {
      data = await prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Lead WHERE createdAt >= ${start} AND isArchived = false
        GROUP BY DATE(createdAt) ORDER BY date ASC
      `;
    } else if (metric === 'tasks_created') {
      data = await prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Task WHERE createdAt >= ${start}
        GROUP BY DATE(createdAt) ORDER BY date ASC
      `;
    } else {
      data = await prisma.$queryRaw`
        SELECT DATE(completedAt) as date, COUNT(*) as count
        FROM Task WHERE completedAt >= ${start}
        GROUP BY DATE(completedAt) ORDER BY date ASC
      `;
    }

    res.json(data.map(r => ({ date: r.date, count: Number(r.count) })));
  } catch (err) { next(err); }
};
