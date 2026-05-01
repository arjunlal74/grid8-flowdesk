import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTags, createTag, deleteTag } from '../../api/settings.api.js';
import Drawer from '../../components/ui/Drawer.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Plus, Trash2, Tag } from 'lucide-react';
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

/* ── Create Drawer ──────────────────────────────────────────── */
function TagDrawer({ open, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { mutate: doCreate, isPending } = useMutation({
    mutationFn: (data) => createTag(data),
    onSuccess: () => {
      toast.success('Tag created');
      qc.invalidateQueries({ queryKey: ['tags'] });
      setName('');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create tag'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    doCreate({ name: name.trim() });
  };

  const handleClose = () => { setName(''); onClose(); };

  return (
    <Drawer open={open} onClose={handleClose} title="New Tag" subtitle="Add a tag to label your leads" width="380px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Tag Name *">
          <input style={fieldStyle} placeholder="e.g. VIP" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </Field>
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="submit" disabled={isPending || !name.trim()} size="sm">
            {isPending ? 'Creating…' : 'Create Tag'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Drawer>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function TagsPage() {
  const qc = useQueryClient();
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: getTags });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { mutate: doDelete } = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag deleted'); },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tags</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {tags?.length || 0} tags
          </p>
        </div>
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus size={13} /> Add Tag
        </Button>
      </div>

      {/* Table */}
      {tags?.length > 0 ? (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {/* Header */}
          <div className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-2)',
            }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Tag</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Actions</span>
          </div>

          {tags.map((tag, i) => (
            <div key={tag.id} className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: '1fr auto',
                borderBottom: i < tags.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
              <div className="flex items-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md" 
                  style={{ background: `${tag.color}12`, border: `1px solid ${tag.color}25` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tag.color }} />
                  <span className="text-[12px] font-medium" style={{ color: tag.color }}>{tag.name}</span>
                </div>
              </div>
              <button onClick={() => doDelete(tag.id)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <Tag size={32} style={{ color: 'var(--text-disabled)', margin: '0 auto 8px' }} />
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>No tags yet</p>
          <Button size="sm" className="mt-4" onClick={() => setDrawerOpen(true)}>
            <Plus size={13} /> Add Tag
          </Button>
        </div>
      )}

      <TagDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
