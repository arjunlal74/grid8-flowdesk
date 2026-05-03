import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, AlertTriangle, Pencil, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { getMyAttendance, getAllAttendance } from '../../api/attendance.api.js';
import { getEmployees } from '../../api/employees.api.js';
import PageLayout from '../../components/layout/PageLayout.jsx';
import CheckInOutCard from '../../components/attendance/CheckInOutCard.jsx';
import PunchEditModal from '../../components/attendance/PunchEditModal.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDuration = (mins) => {
  if (!mins) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const toInputDate = (d) => {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function MissedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium"
      style={{ background: 'var(--warning)/15', color: 'var(--warning)', border: '1px solid var(--warning)/30' }}>
      <AlertTriangle size={10} /> Missed checkout
    </span>
  );
}

function MyAttendanceView({ from, to }) {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-me', from, to],
    queryFn: () => getMyAttendance({ from, to }),
  });

  const summary = useMemo(() => {
    const days = data || [];
    const totalMinutes = days.reduce((s, d) => s + (d.totalMinutes || 0), 0);
    return { totalMinutes, daysWorked: days.length };
  }, [data]);

  return (
    <>
      <div className="rounded-xl p-4 flex items-center gap-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Total worked</span>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {fmtDuration(summary.totalMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Days worked</span>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {summary.daysWorked}
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Date', 'First check-in', 'Last check-out', 'Punches', 'Total hours'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                  style={{ color: 'var(--text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</td></tr>
            )}
            {!isLoading && (data?.length ? data.map((day, i) => (
              <tr key={day.date}
                style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-primary)' }}>
                  <div className="flex items-center gap-2">
                    {fmtDate(day.date)}
                    {day.missedCheckout && <MissedBadge />}
                  </div>
                </td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{fmtTime(day.firstIn)}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{fmtTime(day.lastOut)}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{day.punches.length}</td>
                <td className="px-4 py-3 text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtDuration(day.totalMinutes)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                No attendance records in this range.
              </td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminAttendanceView({ from, to }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);
  const [search, setSearch] = useState('');
  const [editingPunch, setEditingPunch] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const nonAdminEmployees = useMemo(
    () => (employees || []).filter((e) => e.role !== 'ADMIN'),
    [employees],
  );

  const { data: allData, isLoading } = useQuery({
    queryKey: ['attendance-all', from, to],
    queryFn: () => getAllAttendance({ from, to }),
  });

  const employeeRows = useMemo(() => {
    const rows = allData || [];
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.employee.fullName.toLowerCase().includes(q));
  }, [allData, search]);

  const selectedEmployeeData = useMemo(
    () => (allData || []).find((r) => String(r.employee.id) === selectedEmployeeId),
    [allData, selectedEmployeeId],
  );

  return (
    <>
      <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {!selectedEmployeeId ? (
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="px-2.5 py-1.5 rounded-md text-[12px] w-72"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
        ) : (
          <button onClick={() => { setSelectedEmployeeId(''); setExpandedDay(null); }}
            className="text-[12px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            ← All employees
          </button>
        )}
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={12} /> Add punch
        </Button>
      </div>

      {!selectedEmployeeId ? (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Employee', 'Days worked', 'Total hours', 'Last check-in', 'Issues'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</td></tr>
              )}
              {!isLoading && (employeeRows.length ? employeeRows.map((row, i) => {
                const totalMin = row.days.reduce((s, d) => s + d.totalMinutes, 0);
                const lastDay = row.days[0];
                const missedCount = row.days.filter((d) => d.missedCheckout).length;
                return (
                  <tr key={row.employee.id}
                    style={{ borderBottom: i < employeeRows.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
                    onClick={() => setSelectedEmployeeId(String(row.employee.id))}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.employee.fullName} src={row.employee.avatarUrl} size="sm" />
                        <div>
                          <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{row.employee.fullName}</p>
                          {row.employee.designation && (
                            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{row.employee.designation}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{row.days.length}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtDuration(totalMin)}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                      {lastDay ? `${fmtDate(lastDay.date)} · ${fmtTime(lastDay.firstIn)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {missedCount > 0 ? <MissedBadge /> : <span className="text-[12px]" style={{ color: 'var(--text-disabled)' }}>—</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  No attendance records in this range.
                </td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Daily attendance — {selectedEmployeeData?.employee?.fullName || ''}
            </span>
            <button onClick={() => { setSelectedEmployeeId(''); setExpandedDay(null); }}
              className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>← Back to summary</button>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['', 'Date', 'First check-in', 'Last check-out', 'Punches', 'Total hours'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(selectedEmployeeData?.days?.length ? selectedEmployeeData.days.map((day, i) => {
                const isOpen = expandedDay === day.date;
                const isLast = i === selectedEmployeeData.days.length - 1;
                return (
                  <Fragment key={day.date}>
                    <tr
                      style={{ borderBottom: !isOpen && !isLast ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
                      onClick={() => setExpandedDay(isOpen ? null : day.date)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 w-8" style={{ color: 'var(--text-tertiary)' }}>
                        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-primary)' }}>
                        <div className="flex items-center gap-2">
                          {fmtDate(day.date)}
                          {day.missedCheckout && <MissedBadge />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{fmtTime(day.firstIn)}</td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{fmtTime(day.lastOut)}</td>
                      <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{day.punches.length}</td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtDuration(day.totalMinutes)}</td>
                    </tr>
                    {isOpen && (
                      <tr style={{ borderBottom: !isLast ? '1px solid var(--border-subtle)' : 'none' }}>
                        <td colSpan={6} className="p-0" style={{ background: 'var(--bg-surface-2)' }}>
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th className="w-8" />
                                {['Check in', 'Check out', 'Duration', ''].map((h, j) => (
                                  <th key={j} className="text-left px-4 py-2 text-[10.5px] font-medium uppercase tracking-wide"
                                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {day.punches.map((p, j) => {
                                const dur = p.checkOutAt
                                  ? Math.max(0, Math.round((new Date(p.checkOutAt) - new Date(p.checkInAt)) / 60000))
                                  : null;
                                const isStaleOpen = !p.checkOutAt && new Date(p.checkInAt).toDateString() !== new Date().toDateString();
                                return (
                                  <tr key={p.id}
                                    style={{ borderBottom: j < day.punches.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                    <td className="w-8" />
                                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-primary)' }}>
                                      {fmtTime(p.checkInAt)}
                                    </td>
                                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                      <div className="flex items-center gap-2">
                                        {fmtTime(p.checkOutAt)}
                                        {isStaleOpen && <MissedBadge />}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                      {dur !== null ? fmtDuration(dur) : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 w-12">
                                      <button onClick={() => setEditingPunch(p)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-tertiary)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
                                        <Pencil size={11} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              }) : (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  No attendance records in this range.
                </td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PunchEditModal
        open={!!editingPunch}
        punch={editingPunch}
        onClose={() => setEditingPunch(null)}
      />
      <PunchEditModal
        open={creating}
        employees={nonAdminEmployees}
        onClose={() => setCreating(false)}
      />
    </>
  );
}

export default function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [from, setFrom] = useState(toInputDate(monthAgo));
  const [to, setTo] = useState(toInputDate(today));

  return (
    <PageLayout title="Attendance">
      {!isAdmin && <CheckInOutCard />}

      <div className="flex items-center justify-end gap-2">
        <label className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>From</label>
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
          className="px-2 py-1 rounded-md text-[12px]"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
        <label className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>To</label>
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
          className="px-2 py-1 rounded-md text-[12px]"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
      </div>

      {isAdmin
        ? <AdminAttendanceView from={from} to={to} />
        : <MyAttendanceView from={from} to={to} />}
    </PageLayout>
  );
}
