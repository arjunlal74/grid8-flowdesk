import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckSquare, FolderKanban, Clock, ArrowRight } from 'lucide-react';
import { getMyDashboard } from '../../api/dashboard.api.js';
import PageLayout from '../../components/layout/PageLayout.jsx';
import CheckInOutCard from '../../components/attendance/CheckInOutCard.jsx';
import WeeklyHoursChart from '../../components/charts/WeeklyHoursChart.jsx';
import { PriorityBadge } from '../../components/ui/Badge.jsx';
import { useAuthStore } from '../../store/authStore.js';

const greetingFor = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');

const STATUS_BADGE = {
  ACTIVE: { label: 'Active', bg: 'var(--success)/15', fg: 'var(--success)' },
  PLANNING: { label: 'Planning', bg: 'var(--warning)/15', fg: 'var(--warning)' },
  ON_HOLD: { label: 'On hold', bg: 'var(--text-tertiary)/15', fg: 'var(--text-tertiary)' },
};

function StatCard({ icon: Icon, label, sub, value, color }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}14` }}>
          <Icon size={15} style={{ color }} />
        </span>
        <div className="flex flex-col">
          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
          {sub && <span className="text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
        </div>
      </div>
      <span className="text-[28px] font-bold leading-none tracking-tight"
        style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function SectionTitle({ children, sub, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</p>
        {sub && <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export default function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({ queryKey: ['my-dashboard'], queryFn: getMyDashboard });

  return (
    <PageLayout title="Dashboard">
      {/* Greeting + check-in pill */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}>
            {greetingFor()}, {user?.fullName?.split(' ')[0] || 'there'}
          </h2>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Here's your work summary for today.
          </p>
        </div>
        <CheckInOutCard />
      </div>

      {/* Top row: 3 stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={CheckSquare}
          label="Today's Tasks"
          sub="Focus on what matters most"
          value={isLoading ? '…' : (data?.todayTasks ?? 0)}
          color="#60A5FA"
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          sub="Keep everything on track"
          value={isLoading ? '…' : (data?.activeProjects ?? 0)}
          color="#4ADE80"
        />
        <StatCard
          icon={Clock}
          label="Hours Tracked"
          sub="This week so far"
          value={isLoading ? '…' : `${Math.round(data?.weeklyHours ?? 0)}H`}
          color="#FBBF24"
        />
      </div>

      {/* Middle row: weekly chart + priority tasks */}
      <div className="grid grid-cols-12 gap-3">
        {/* Weekly Activity */}
        <div className="col-span-7 rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <SectionTitle
            sub="Your working hours this week"
            action={
              <span className="text-[11.5px] px-2.5 py-1 rounded-md font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                {Math.round(data?.weeklyHours ?? 0)} h total
              </span>
            }
          >
            Weekly Activity
          </SectionTitle>
          <div className="p-3">
            <WeeklyHoursChart data={data?.weeklyActivity || []} height={240} />
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="col-span-5 rounded-xl overflow-hidden flex flex-col"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <SectionTitle
            sub="Top items assigned to you"
            action={
              <Link to="/tasks" className="text-[11px] flex items-center gap-1"
                style={{ color: 'var(--text-tertiary)' }}>
                View all <ArrowRight size={11} />
              </Link>
            }
          >
            Priority Tasks
          </SectionTitle>
          <div className="flex-1 overflow-y-auto">
            {(data?.priorityTasks?.length ?? 0) === 0 ? (
              <p className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                No open tasks assigned to you.
              </p>
            ) : (
              data.priorityTasks.map((t, i) => (
                <Link key={t.id} to={`/tasks/${t.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ borderBottom: i < data.priorityTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: t.status?.color || 'var(--text-disabled)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {t.title}
                    </p>
                    <p className="text-[10.5px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {t.project?.name || 'No project'}
                      {t.dueDate ? ` · Due ${fmtDate(t.dueDate)}` : ''}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <SectionTitle
          sub="Manage your ongoing work"
          action={
            <Link to="/projects" className="text-[11px] flex items-center gap-1"
              style={{ color: 'var(--text-tertiary)' }}>
              View all <ArrowRight size={11} />
            </Link>
          }
        >
          Recent Projects
        </SectionTitle>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Project', 'Deadline', 'Status', 'Progress'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                  style={{ color: 'var(--text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.recentProjects?.length ?? 0) === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                You're not on any projects yet.
              </td></tr>
            ) : data.recentProjects.map((p, i) => {
              const badge = STATUS_BADGE[p.status] || { label: p.status, bg: 'var(--bg-surface-2)', fg: 'var(--text-tertiary)' };
              return (
                <tr key={p.id}
                  style={{ borderBottom: i < data.recentProjects.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-3">
                    <Link to={`/projects/${p.id}`} className="flex items-center gap-2.5 text-[12.5px] font-medium"
                      style={{ color: 'var(--text-primary)' }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {fmtDate(p.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: badge.bg, color: badge.fg, border: `1px solid ${badge.fg}30` }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 max-w-[280px]">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${p.progress}%`, background: p.color || 'var(--accent)' }} />
                      </div>
                      <span className="text-[11.5px] font-semibold tabular-nums w-10 text-right"
                        style={{ color: 'var(--text-secondary)' }}>{p.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
