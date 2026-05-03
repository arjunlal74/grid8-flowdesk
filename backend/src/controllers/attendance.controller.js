import prisma from '../config/db.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const isSameLocalDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

const aggregateByDay = (punches, todayRef = new Date()) => {
  const byDay = new Map();
  for (const p of punches) {
    const key = startOfDay(p.checkInAt).toISOString();
    if (!byDay.has(key)) {
      byDay.set(key, {
        date: key,
        punches: [],
        totalMinutes: 0,
        firstIn: p.checkInAt,
        lastOut: null,
        missedCheckout: false,
      });
    }
    const day = byDay.get(key);
    day.punches.push(p);
    if (p.checkInAt < day.firstIn) day.firstIn = p.checkInAt;
    if (p.checkOutAt) {
      if (!day.lastOut || p.checkOutAt > day.lastOut) day.lastOut = p.checkOutAt;
      day.totalMinutes += Math.max(0, Math.round((new Date(p.checkOutAt) - new Date(p.checkInAt)) / 60000));
    } else if (!isSameLocalDay(p.checkInAt, todayRef)) {
      // Open punch on a past day — forgotten check-out. Don't count, flag for repair.
      day.missedCheckout = true;
    }
  }
  return Array.from(byDay.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const checkIn = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Admins do not record attendance.' });
    }
    const open = await prisma.attendancePunch.findFirst({
      where: { employeeId: req.user.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (open) {
      const sameDay = isSameLocalDay(open.checkInAt, new Date());
      const msg = sameDay
        ? "You're already checked in. Please check out before starting a new session."
        : `You have an unresolved check-in from ${new Date(open.checkInAt).toLocaleDateString('en-IN')}. Resolve it in Attendance before checking in again.`;
      return res.status(409).json({ error: msg, openPunchId: open.id, openSince: open.checkInAt });
    }

    const punch = await prisma.attendancePunch.create({
      data: { employeeId: req.user.id, checkInAt: new Date() },
    });
    res.status(201).json(punch);
  } catch (err) { next(err); }
};

export const checkOut = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Admins do not record attendance.' });
    }
    const open = await prisma.attendancePunch.findFirst({
      where: { employeeId: req.user.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (!open) return res.status(400).json({ error: "You're not currently checked in." });

    const punch = await prisma.attendancePunch.update({
      where: { id: open.id },
      data: { checkOutAt: new Date() },
    });
    res.json(punch);
  } catch (err) { next(err); }
};

export const status = async (req, res, next) => {
  try {
    const today = new Date();
    const todayPunches = await prisma.attendancePunch.findMany({
      where: {
        employeeId: req.user.id,
        checkInAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      orderBy: { checkInAt: 'asc' },
    });
    const todayOpen = todayPunches.find((p) => !p.checkOutAt) || null;
    const staleOpen = await prisma.attendancePunch.findFirst({
      where: {
        employeeId: req.user.id,
        checkOutAt: null,
        checkInAt: { lt: startOfDay(today) },
      },
      orderBy: { checkInAt: 'desc' },
    });
    res.json({
      openPunchId: todayOpen?.id || null,
      openSince: todayOpen?.checkInAt || null,
      todayPunches,
      staleOpen: staleOpen ? { id: staleOpen.id, checkInAt: staleOpen.checkInAt } : null,
    });
  } catch (err) { next(err); }
};

export const myHistory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = to ? endOfDay(to) : endOfDay(new Date());

    const punches = await prisma.attendancePunch.findMany({
      where: {
        employeeId: req.user.id,
        checkInAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { checkInAt: 'asc' },
    });

    res.json(aggregateByDay(punches));
  } catch (err) { next(err); }
};

// ---------- Admin endpoints ----------

export const allHistory = async (req, res, next) => {
  try {
    const { from, to, employeeId } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = to ? endOfDay(to) : endOfDay(new Date());

    const employees = await prisma.employee.findMany({
      where: {
        role: { not: 'ADMIN' },
        ...(employeeId ? { id: parseInt(employeeId) } : {}),
      },
      select: { id: true, fullName: true, avatarUrl: true, designation: true, isActive: true },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });

    const punches = await prisma.attendancePunch.findMany({
      where: {
        checkInAt: { gte: fromDate, lte: toDate },
        employeeId: { in: employees.map((e) => e.id) },
      },
      orderBy: [{ employeeId: 'asc' }, { checkInAt: 'asc' }],
    });

    const punchesByEmp = new Map();
    for (const p of punches) {
      if (!punchesByEmp.has(p.employeeId)) punchesByEmp.set(p.employeeId, []);
      punchesByEmp.get(p.employeeId).push(p);
    }

    const result = employees.map((emp) => ({
      employee: emp,
      days: aggregateByDay(punchesByEmp.get(emp.id) || []),
    }));

    res.json(result);
  } catch (err) { next(err); }
};

export const listPunches = async (req, res, next) => {
  try {
    const { employeeId, from, to } = req.query;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
    const fromDate = from ? startOfDay(from) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = to ? endOfDay(to) : endOfDay(new Date());

    const punches = await prisma.attendancePunch.findMany({
      where: {
        employeeId: parseInt(employeeId),
        checkInAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { checkInAt: 'desc' },
    });
    res.json(punches);
  } catch (err) { next(err); }
};

export const adminCreate = async (req, res, next) => {
  try {
    const { employeeId, checkInAt, checkOutAt } = req.body;
    if (!employeeId || !checkInAt) return res.status(400).json({ error: 'employeeId and checkInAt are required' });
    if (checkOutAt && new Date(checkOutAt) < new Date(checkInAt)) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }
    const punch = await prisma.attendancePunch.create({
      data: {
        employeeId: parseInt(employeeId),
        checkInAt: new Date(checkInAt),
        checkOutAt: checkOutAt ? new Date(checkOutAt) : null,
      },
    });
    res.status(201).json(punch);
  } catch (err) { next(err); }
};

export const adminUpdate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { checkInAt, checkOutAt } = req.body;
    const existing = await prisma.attendancePunch.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Punch not found' });

    const data = {};
    if (checkInAt !== undefined) data.checkInAt = new Date(checkInAt);
    if (checkOutAt !== undefined) data.checkOutAt = checkOutAt === null ? null : new Date(checkOutAt);

    const finalIn = data.checkInAt || existing.checkInAt;
    const finalOut = 'checkOutAt' in data ? data.checkOutAt : existing.checkOutAt;
    if (finalOut && new Date(finalOut) < new Date(finalIn)) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    const punch = await prisma.attendancePunch.update({ where: { id }, data });
    res.json(punch);
  } catch (err) { next(err); }
};

export const adminDelete = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.attendancePunch.delete({ where: { id } });
    res.status(204).end();
  } catch (err) { next(err); }
};
