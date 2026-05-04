import prisma from '../config/db.js';

const noteInclude = {
  items: { orderBy: { position: 'asc' } },
};

export const index = async (req, res, next) => {
  try {
    const notes = await prisma.note.findMany({
      where: { employeeId: req.user.id },
      include: noteInclude,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { type, title, body, color, items } = req.body;
    const note = await prisma.note.create({
      data: {
        employeeId: req.user.id,
        type,
        title: title || null,
        body: body || null,
        color: color || null,
        items: items?.length ? {
          create: items.map((item, i) => ({
            text: item.text,
            isDone: item.isDone ?? false,
            position: item.position ?? i,
          })),
        } : undefined,
      },
      include: noteInclude,
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

export const show = async (req, res, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: +req.params.id, employeeId: req.user.id },
      include: noteInclude,
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json(note);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: +req.params.id, employeeId: req.user.id },
    });
    if (!note) return res.status(404).json({ error: 'Not found' });

    const { title, body, color, items } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.noteItem.deleteMany({ where: { noteId: note.id } });
        if (items.length > 0) {
          await tx.noteItem.createMany({
            data: items.map((item, i) => ({
              noteId: note.id,
              text: item.text,
              isDone: item.isDone ?? false,
              position: item.position ?? i,
            })),
          });
        }
      }
      return tx.note.update({
        where: { id: note.id },
        data: {
          title: title !== undefined ? title || null : undefined,
          body: body !== undefined ? body || null : undefined,
          color: color !== undefined ? color || null : undefined,
        },
        include: noteInclude,
      });
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const destroy = async (req, res, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: +req.params.id, employeeId: req.user.id },
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    await prisma.note.delete({ where: { id: note.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
