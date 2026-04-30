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
