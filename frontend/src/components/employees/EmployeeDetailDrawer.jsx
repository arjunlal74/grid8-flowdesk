import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployee, deactivateEmployee, reactivateEmployee } from '../../api/employees.api.js';
import Drawer from '../ui/Drawer.jsx';
import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';

const ROLE_COLORS = { ADMIN: '#F87171', MANAGER: '#FBBF24', MEMBER: '#60A5FA' };

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5"
        style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-widest"
      style={{ color: 'var(--text-tertiary)' }}>{children}</p>
  );
}

export default function EmployeeDetailDrawer({ employeeId, open, onClose }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null); // 'activate' | 'deactivate' | null

  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: open && !!employeeId,
  });

  const { mutate: doDeactivate, isPending: deactivating } = useMutation({
    mutationFn: () => deactivateEmployee(employeeId),
    onSuccess: () => {
      toast.success('Employee deactivated');
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to deactivate'),
  });

  const { mutate: doReactivate, isPending: reactivating } = useMutation({
    mutationFn: () => reactivateEmployee(employeeId),
    onSuccess: () => {
      toast.success('Employee reactivated');
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reactivate'),
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Employee Details"
      width="420px"
    >
      {isLoading && (
        <div className="text-[12px] pt-4" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      )}

      {!isLoading && emp && (
        <div className="space-y-6">
          {/* Avatar + badges */}
          <div className="flex flex-col items-center gap-3 pb-2">
            {emp.avatarUrl ? (
              <img
                src={emp.avatarUrl}
                alt={emp.fullName}
                className="rounded-full object-cover"
                style={{ width: '96px', height: '96px', border: '2px solid var(--border-default)' }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center font-bold"
                style={{
                  width: '96px', height: '96px', fontSize: '28px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '2px solid var(--border-default)',
                }}
              >
                {emp.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>{emp.fullName}</p>
              {emp.designation && (
                <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{emp.designation}</p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge color={ROLE_COLORS[emp.role]}>{emp.role}</Badge>
                <Badge color={emp.isActive ? '#4ADE80' : '#6B6B6B'}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <SectionLabel>Contact</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Email" value={emp.email} />
              <DetailRow label="Phone" value={emp.phone} />
            </div>
          </div>

          {/* Work */}
          <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <SectionLabel>Work</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Designation" value={emp.designation} />
              <DetailRow label="Department" value={emp.department} />
              <DetailRow label="Open Tasks" value={emp._count?.taskAssignments ?? 0} />
            </div>
          </div>

          {/* Account */}
          <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <SectionLabel>Account</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow
                label="Joined"
                value={emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString('en-IN') : null}
              />
              <DetailRow
                label="Last Login"
                value={emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString('en-IN') : 'Never'}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button
              disabled={emp.isActive}
              onClick={() => setConfirm('activate')}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-opacity disabled:opacity-40"
              style={{ background: '#22c55e', color: '#fff', border: 'none' }}
            >
              Activate
            </button>
            <button
              disabled={!emp.isActive}
              onClick={() => setConfirm('deactivate')}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-opacity disabled:opacity-40"
              style={{ background: '#ef4444', color: '#fff', border: 'none' }}
            >
              Deactivate
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'activate' ? 'Activate Employee' : 'Deactivate Employee'}
        size="sm"
      >
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {confirm === 'activate'
            ? `Are you sure you want to activate ${emp?.fullName}? They will regain access to the platform.`
            : `Are you sure you want to deactivate ${emp?.fullName}? They will lose access to the platform.`}
        </p>
        <div className="flex gap-2.5">
          {confirm === 'activate' ? (
            <button
              disabled={reactivating}
              onClick={() => doReactivate()}
              className="px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
              style={{ background: '#22c55e', color: '#fff' }}
            >
              {reactivating ? 'Activating…' : 'Yes, Activate'}
            </button>
          ) : (
            <button
              disabled={deactivating}
              onClick={() => doDeactivate()}
              className="px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {deactivating ? 'Deactivating…' : 'Yes, Deactivate'}
            </button>
          )}
          <button
            onClick={() => setConfirm(null)}
            className="px-4 py-2 rounded-lg text-[12.5px] font-medium transition-colors"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </Drawer>
  );
}
