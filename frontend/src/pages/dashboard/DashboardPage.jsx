import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStats, getPipeline, getActivity, getChart } from '../../api/dashboard.api.js';
import Tabs from '../../components/ui/Tabs.jsx';
import Button from '../../components/ui/Button.jsx';
import AreaChart from '../../components/charts/AreaChart.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';

const rangeTabs = [
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
];

const chartTabs = [
  { value: 'leads', label: 'New Leads' },
  { value: 'tasks_created', label: 'Tasks Created' },
  { value: 'tasks_done', label: 'Tasks Done' },
];

function KPICard({ label, value, delta }) {
  const isPositive = delta >= 0;
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {delta !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive
            ? <TrendingUp size={11} style={{ color: 'var(--success)' }} />
            : <TrendingDown size={11} style={{ color: 'var(--danger)' }} />}
          <span className="text-[11px] font-medium" style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
            {isPositive ? '+' : ''}{delta}% vs. previous period
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState('7d');
  const [chartMetric, setChartMetric] = useState('leads');

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats', range], queryFn: () => getStats(range) });
  const { data: pipeline } = useQuery({ queryKey: ['dashboard-pipeline'], queryFn: getPipeline });
  const { data: activity } = useQuery({ queryKey: ['dashboard-activity'], queryFn: getActivity });
  const { data: chartData } = useQuery({ queryKey: ['dashboard-chart', chartMetric, range], queryFn: () => getChart(chartMetric, range) });

  const pipelineTotal = pipeline?.reduce((a, r) => a + r.count, 0) || 1;
  const totalValue = pipeline?.reduce((a, r) => a + r.value, 0) || 0;

  return (
    <PageLayout
      title="Dashboard"
      actions={<Button variant="outline" size="sm"><Bell size={12} />Add Alert</Button>}
    >
      {/* Range tabs */}
      <Tabs tabs={rangeTabs} active={range} onChange={setRange} />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="New Leads" value={stats?.newLeads ?? 0} delta={stats?.leadsDelta} />
        <KPICard label="Conversion %" value={stats ? `${stats.conversionRate}%` : '0%'} />
        <KPICard label="Open Tasks" value={stats?.openTasks ?? 0} />
        <KPICard label="Tasks Completed" value={stats?.completedTasks ?? 0} />
      </div>

      {/* Middle row: Sales Details + Cashflow */}
      <div className="grid grid-cols-12 gap-3">

        {/* Lead Pipeline — col 8 */}
        <div className="col-span-8 rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Lead Pipeline</span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Last Updated just now</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Status', 'Count', 'Approval %', 'Value'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pipeline?.map((row, i) => (
                <tr key={row.id}
                  style={{ borderBottom: i < pipeline.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: row.color }} />
                      <span className="text-[12.5px]" style={{ color: 'var(--text-primary)' }}>{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-medium w-8" style={{ color: 'var(--text-primary)' }}>
                        {row.count}
                      </span>
                      <div className="w-20 h-1 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${(row.count / pipelineTotal) * 100}%`, background: 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {row.percentage}%
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px]" style={{ color: 'var(--text-primary)' }}>
                    ₹{Number(row.value).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cashflow-style aside — col 4 */}
        <div className="col-span-4 rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Activity</span>

          <div className="space-y-2.5 flex-1">
            {activity?.length ? activity.map(log => (
              <div key={log.id} className="flex items-start gap-2.5">
                <Avatar name={log.actor.fullName} src={log.actor.avatarUrl} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] leading-snug" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{log.actor.fullName}</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {log.action} {log.entityType.toLowerCase()} #{log.entityId}
                    </span>
                  </p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                No recent activity
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-[11.5px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Pipeline Summary</p>
            {pipeline?.filter(r => r.count > 0).slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                <span className="text-[11.5px] font-medium" style={{ color: 'var(--text-primary)' }}>₹{Number(r.value).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Total Pipeline</span>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview chart */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-0 px-4 pt-4 pb-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="text-[13px] font-semibold mr-4" style={{ color: 'var(--text-primary)' }}>Overview</span>
          {chartTabs.map(t => {
            const isActive = chartMetric === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setChartMetric(t.value)}
                className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all -mb-px"
                style={{
                  borderBottomColor: isActive ? 'var(--text-primary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-3">
          <AreaChart data={chartData || []} height={200} />
        </div>
      </div>

    </PageLayout>
  );
}
