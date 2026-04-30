import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../../api/settings.api.js';
import Button from '../../components/ui/Button.jsx';
import { Plus, ChevronRight } from 'lucide-react';
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
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [parentId, setParentId] = useState('');
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const { mutate: doCreate } = useMutation({
    mutationFn: () => createCategory({ name: newName, parentId: parentId ? parseInt(parentId) : undefined }),
    onSuccess: () => { setNewName(''); setParentId(''); qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-[16px] font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Lead Categories</h1>

      <div className="rounded-xl overflow-hidden mb-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {categories?.map((parent, pi) => (
          <div key={parent.id}>
            <div className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{parent.name}</span>
            </div>
            {parent.children?.map((child, ci) => (
              <div key={child.id} className="flex items-center gap-2 px-4 py-2.5 pl-9"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderBottom: (pi < categories.length - 1 || ci < parent.children.length - 1) ? '1px solid var(--border-subtle)' : 'none',
                }}>
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{child.name}</span>
              </div>
            ))}
          </div>
        ))}
        {!categories?.length && (
          <div className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No categories yet.</div>
        )}
      </div>

      <div className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Add Category</p>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name…" style={fieldStyle} />
        <select value={parentId} onChange={e => setParentId(e.target.value)} style={fieldStyle}>
          <option value="">Top-level category</option>
          {categories?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Button onClick={() => newName.trim() && doCreate()} disabled={!newName.trim()} size="sm">
          <Plus size={12} /> Add Category
        </Button>
      </div>
    </div>
  );
}
