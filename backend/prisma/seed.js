import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin employee
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@grid8.local' },
    update: {},
    create: {
      fullName: 'Grid8 Admin',
      email: 'admin@grid8.local',
      passwordHash,
      role: 'ADMIN',
      designation: 'Administrator',
    },
  });

  // Lead statuses
  const leadStatuses = [
    { name: 'New', slug: 'new', color: '#60A5FA', order: 0, isDefault: true },
    { name: 'Contacted', slug: 'contacted', color: '#A78BFA', order: 1 },
    { name: 'Qualified', slug: 'qualified', color: '#34D399', order: 2 },
    { name: 'Proposal Sent', slug: 'proposal-sent', color: '#FBBF24', order: 3 },
    { name: 'Negotiation', slug: 'negotiation', color: '#FBBF24', order: 4 },
    { name: 'Won', slug: 'won', color: '#4ADE80', order: 5, isWon: true },
    { name: 'Lost', slug: 'lost', color: '#6B6B6B', order: 6, isLost: true },
  ];
  for (const s of leadStatuses) {
    await prisma.leadStatus.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  // Task statuses
  const taskStatuses = [
    { name: 'Backlog', slug: 'backlog', color: '#6B6B6B', order: 0, isDefault: true },
    { name: 'To Do', slug: 'to-do', color: '#60A5FA', order: 1 },
    { name: 'In Progress', slug: 'in-progress', color: '#FBBF24', order: 2 },
    { name: 'In Review', slug: 'in-review', color: '#A78BFA', order: 3 },
    { name: 'Done', slug: 'done', color: '#4ADE80', order: 4, isDone: true },
  ];
  for (const s of taskStatuses) {
    await prisma.taskStatus.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  // Lead categories with hierarchy
  const parentCategories = [
    { name: 'Fitness & Wellness', slug: 'fitness-wellness', children: ['Gym Owner', 'Yoga Studio', 'Personal Trainer'] },
    { name: 'Food & Beverage', slug: 'food-beverage', children: ['Restaurant', 'Cafe', 'Cloud Kitchen'] },
    { name: 'Retail', slug: 'retail', children: ['Product Owner', 'D2C Brand', 'Boutique'] },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', children: ['Salon', 'Spa'] },
    { name: 'Professional Services', slug: 'professional-services', children: ['Clinic', 'Consultant'] },
    { name: 'Other', slug: 'other', children: [] },
  ];

  for (const parent of parentCategories) {
    const parentRecord = await prisma.leadCategory.upsert({
      where: { slug: parent.slug },
      update: {},
      create: { name: parent.name, slug: parent.slug },
    });
    for (const childName of parent.children) {
      const childSlug = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.leadCategory.upsert({
        where: { slug: childSlug },
        update: {},
        create: { name: childName, slug: childSlug, parentId: parentRecord.id },
      });
    }
  }

  // Tags
  const tags = ['Hot', 'Follow-up', 'Demo Done', 'Budget Confirmed', 'Decision Maker'];
  for (const name of tags) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Sample project
  await prisma.project.upsert({
    where: { slug: 'internal-grid8-build' },
    update: {},
    create: {
      name: 'Internal — Grid8 Build',
      slug: 'internal-grid8-build',
      code: 'GR-001',
      managerId: admin.id,
      status: 'ACTIVE',
    },
  });

  // App settings
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, orgName: 'Grid8' },
  });

  console.log('Seed complete. Admin: admin@grid8.local / Admin@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
