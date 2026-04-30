import prisma from '../config/db.js';

export const logActivity = async ({ actorId, entityType, entityId, action, changes, leadId, taskId }) => {
  return prisma.activityLog.create({
    data: { actorId, entityType, entityId, action, changes, leadId, taskId },
  });
};
