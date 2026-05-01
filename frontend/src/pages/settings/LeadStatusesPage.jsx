import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeadStatuses, createLeadStatus, updateLeadStatus } from '../../api/settings.api.js';
import Drawer from '../../components/ui/Drawer.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Plus, Pencil, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';

const fieldStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '12.5px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Drawer ─────────────────────────────────────────────────── */
function StatusDrawer({ open, onClose, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [name, setName] = useState('');

  if (open && isEdit && name === '' && editItem.name) {
    setName(editItem.name);
  }

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: (data) => createLeadStatus(data),
    onSuccess: () => {
      toast.success('Status created');
      qc.invalidateQueries({ queryKey: ['lead-statuses'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create status'),
  });

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: (data) => updateLeadStatus(editItem.id, data),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['lead-statuses'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit) doUpdate({ name: name.trim() });
    else doCreate({ name: name.trim() });
  };

  const handleClose = () => { setName(''); onClose(); };
  const isPending = creating || updating;

  return (
    <Drawer open={open} onClose={handleClose}
      title={isEdit ? 'Edit Lead Status' : 'New Lead Status'}
      subtitle={isEdit ? `Editing "${editItem?.name}"` : 'Add a new pipeline stage'}
      width="380px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Status Name *">
          <input style={fieldStyle} placeholder="e.g. Follow Up" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </Field>
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="submit" disabled={isPending || !name.trim()} size="sm">
            {isPending ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Status')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Drawer>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function LeadStatusesPage() {
  const { data: statuses } = useQuery({ queryKey: ['lead-statuses'], queryFn: getLeadStatuses });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const openCreate = () => { setEditItem(null); setDrawerOpen(true); };
  const openEdit = (item) => { setEditItem(item); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditItem(null); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Lead Statuses</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {statuses?.length || 0} pipeline stages
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={13} /> Add Status
        </Button>
      </div>

      {/* Table */}
      {statuses?.length > 0 ? (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {/* Header */}
          <div className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '2fr 1fr auto',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-2)',
            }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Type</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Actions</span>
          </div>

          {statuses.map((s, i) => (
            <div key={s.id} className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: '2fr 1fr auto',
                borderBottom: i < statuses.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}60` }} />
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {s.isDefault && <Badge color="#60A5FA">Default</Badge>}
                {s.isWon && <Badge color="#4ADE80">Won</Badge>}
                {s.isLost && <Badge color="#F87171">Lost</Badge>}
              </div>
              <button onClick={() => openEdit(s)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                <Pencil size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <CircleDot size={32} style={{ color: 'var(--text-disabled)', margin: '0 auto 8px' }} />
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>No lead statuses yet</p>
          <Button size="sm" className="mt-4" onClick={openCreate}><Plus size={13} /> Add Status</Button>
        </div>
      )}

      <StatusDrawer open={drawerOpen} onClose={closeDrawer} editItem={editItem} />
    </div>
  );
}
