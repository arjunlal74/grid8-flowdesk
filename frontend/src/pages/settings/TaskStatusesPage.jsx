import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskStatuses, createTaskStatus, updateTaskStatus } from '../../api/settings.api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const fieldStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '6px',
  padding: '5px 10px',
  fontSize: '12.5px',
  outline: 'none',
  flex: 1,
};

export default function TaskStatusesPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: statuses } = useQuery({ queryKey: ['task-statuses'], queryFn: getTaskStatuses });

  const { mutate: doCreate } = useMutation({
    mutationFn: () => createTaskStatus({ name: newName }),
    onSuccess: () => { setNewName(''); qc.invalidateQueries({ queryKey: ['task-statuses'] }); toast.success('Status created'); },
  });

  const { mutate: doUpdate } = useMutation({
    mutationFn: (id) => updateTaskStatus(id, { name: editName }),
    onSuccess: () => { setEditId(null); qc.invalidateQueries({ queryKey: ['task-statuses'] }); },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-[16px] font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Task Statuses</h1>

      <div className="rounded-xl overflow-hidden mb-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {statuses?.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < (statuses.length - 1) ? '1px solid var(--border-subtle)' : 'none' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            {editId === s.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doUpdate(s.id); if (e.key === 'Escape') setEditId(null); }}
                style={fieldStyle}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-[12.5px]" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
            )}
            <div className="flex items-center gap-1.5">
              {s.isDefault && <Badge color="#60A5FA">Default</Badge>}
              {s.isDone && <Badge color="#4ADE80">Done</Badge>}
              <button onClick={() => { setEditId(s.id); setEditName(s.name); }}
                className="p-1.5 rounded transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <Pencil size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) doCreate(); }}
          placeholder="New status name…"
          style={{ ...fieldStyle, padding: '7px 12px', borderRadius: '8px' }}
        />
        <Button onClick={() => newName.trim() && doCreate()} disabled={!newName.trim()} size="sm">
          <Plus size={12} /> Add
        </Button>
      </div>
    </div>
  );
}
