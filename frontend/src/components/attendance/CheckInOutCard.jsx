import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAttendanceStatus, checkIn, checkOut } from '../../api/attendance.api.js';

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const pad = (n) => String(n).padStart(2, '0');
const fmtClock = (totalSec) => {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export default function CheckInOutCard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['attendance-status'], queryFn: getAttendanceStatus });
  const [now, setNow] = useState(Date.now());

  const isCheckedIn = !!data?.openPunchId;

  useEffect(() => {
    if (!isCheckedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isCheckedIn]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['attendance-status'] });
    qc.invalidateQueries({ queryKey: ['attendance-me'] });
    qc.invalidateQueries({ queryKey: ['my-dashboard'] });
  };

  const checkInMut = useMutation({
    mutationFn: checkIn,
    onSuccess: () => { toast.success('Checked in'); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Check-in failed'),
  });

  const checkOutMut = useMutation({
    mutationFn: checkOut,
    onSuccess: () => { toast.success('Checked out'); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Check-out failed'),
  });

  const todayPunches = data?.todayPunches || [];
  const todaySeconds = todayPunches.reduce((sum, p) => {
    const end = p.checkOutAt ? new Date(p.checkOutAt) : (isCheckedIn && p.id === data.openPunchId ? new Date(now) : null);
    if (!end) return sum;
    return sum + Math.max(0, Math.floor((end - new Date(p.checkInAt)) / 1000));
  }, 0);

  const subtitle = isCheckedIn
    ? `Started ${fmtTime(data.openSince)}`
    : todayPunches.length > 0
      ? `Last out ${fmtTime(todayPunches[todayPunches.length - 1].checkOutAt)}`
      : 'Not started yet';

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="inline-flex items-stretch rounded-full overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {/* Status + clock + subtitle */}
        <div className="flex items-center gap-2.5 pl-3 pr-3 py-1.5">
          <span className="relative flex w-2 h-2">
            {isCheckedIn && (
              <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping"
                style={{ background: 'var(--success)' }} />
            )}
            <span className="relative inline-flex w-2 h-2 rounded-full"
              style={{ background: isCheckedIn ? 'var(--success)' : 'var(--text-disabled)' }} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-bold tabular-nums tracking-tight"
              style={{ color: 'var(--text-primary)' }}>
              {fmtClock(todaySeconds)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {subtitle}
            </span>
          </div>
        </div>

        {/* Single primary action — flips between Check in / Check out */}
        {isCheckedIn ? (
          <button
            disabled={isLoading || checkOutMut.isPending}
            onClick={() => checkOutMut.mutate()}
            className="inline-flex items-center gap-1.5 px-4 text-[12.5px] font-semibold transition-colors disabled:opacity-50"
            style={{
              background: 'var(--danger)',
              color: '#fff',
              borderLeft: '1px solid var(--border-subtle)',
            }}>
            <LogOut size={13} /> Check out
          </button>
        ) : (
          <button
            disabled={isLoading || checkInMut.isPending}
            onClick={() => checkInMut.mutate()}
            className="inline-flex items-center gap-1.5 px-4 text-[12.5px] font-semibold transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              borderLeft: '1px solid var(--border-subtle)',
            }}>
            <LogIn size={13} /> Check in
          </button>
        )}
      </div>

      {data?.staleOpen && (
        <Link to="/attendance"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px]"
          style={{ background: 'var(--warning)/10', border: '1px solid var(--warning)/30', color: 'var(--text-primary)' }}>
          <AlertTriangle size={11} style={{ color: 'var(--warning)' }} />
          Missed checkout from {new Date(data.staleOpen.checkInAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          <span style={{ color: 'var(--text-tertiary)' }}>· fix</span>
        </Link>
      )}
    </div>
  );
}
