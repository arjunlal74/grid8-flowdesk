import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { createPunch, updatePunch, deletePunch } from '../../api/attendance.api.js';

const toLocalInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export default function PunchEditModal({ open, onClose, punch, employee, employees }) {
  const qc = useQueryClient();
  const isCreate = !punch;

  const [employeeId, setEmployeeId] = useState('');
  const [checkInAt, setCheckInAt] = useState('');
  const [checkOutAt, setCheckOutAt] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmployeeId(punch?.employeeId ?? employee?.id ?? employees?.[0]?.id ?? '');
    setCheckInAt(toLocalInput(punch?.checkInAt) || toLocalInput(new Date()));
    setCheckOutAt(toLocalInput(punch?.checkOutAt));
  }, [open, punch, employee, employees]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['attendance-status'] });
    qc.invalidateQueries({ queryKey: ['attendance-me'] });
    qc.invalidateQueries({ queryKey: ['attendance-all'] });
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        checkInAt: new Date(checkInAt).toISOString(),
        checkOutAt: checkOutAt ? new Date(checkOutAt).toISOString() : null,
      };
      if (isCreate) return createPunch({ ...payload, employeeId: parseInt(employeeId) });
      return updatePunch(punch.id, payload);
    },
    onSuccess: () => { toast.success(isCreate ? 'Punch added' : 'Punch updated'); invalidate(); onClose(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Save failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePunch(punch.id),
    onSuccess: () => { toast.success('Punch deleted'); invalidate(); onClose(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Delete failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title={isCreate ? 'Add attendance punch' : 'Edit attendance punch'} size="sm">
      <div className="flex flex-col gap-3">
        {isCreate && employees && (
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>Employee</span>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              className="px-2.5 py-1.5 rounded-md text-[12.5px]"
              style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>Check in</span>
          <input type="datetime-local" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-[12.5px]"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>Check out (optional)</span>
          <input type="datetime-local" value={checkOutAt} onChange={(e) => setCheckOutAt(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-[12.5px]"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
          <span className="text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>Leave blank to mark as still open.</span>
        </label>

        <div className="flex items-center justify-between gap-2 mt-2">
          {!isCreate ? (
            <Button variant="danger" size="sm" disabled={deleteMut.isPending}
              onClick={() => { if (confirm('Delete this punch?')) deleteMut.mutate(); }}>
              <Trash2 size={12} /> Delete
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={saveMut.isPending || !checkInAt || (isCreate && !employeeId)}
              onClick={() => saveMut.mutate()}>
              {isCreate ? 'Add punch' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
