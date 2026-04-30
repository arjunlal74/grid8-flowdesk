import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTags, createTag, deleteTag } from '../../api/settings.api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TagsPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const { mutate: doCreate } = useMutation({
    mutationFn: () => createTag({ name: newName }),
    onSuccess: () => { setNewName(''); qc.invalidateQueries({ queryKey: ['tags'] }); },
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag deleted'); },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-[16px] font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Tags</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags?.map(tag => (
          <div key={tag.id} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <Badge color={tag.color}>{tag.name}</Badge>
            <button onClick={() => doDelete(tag.id)}
              className="transition-colors"
              style={{ color: 'var(--text-disabled)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
              <X size={11} />
            </button>
          </div>
        ))}
        {!tags?.length && (
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No tags yet.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) doCreate(); }}
          placeholder="New tag name…"
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '12.5px',
            flex: 1,
            outline: 'none',
          }}
        />
        <Button onClick={() => newName.trim() && doCreate()} disabled={!newName.trim()} size="sm">
          <Plus size={12} /> Add
        </Button>
      </div>
    </div>
  );
}
