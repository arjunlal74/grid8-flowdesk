import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory } from '../../api/settings.api.js';
import Drawer from '../../components/ui/Drawer.jsx';
import Button from '../../components/ui/Button.jsx';
import { Plus, Pencil, FolderOpen } from 'lucide-react';
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

/* ── Drawer for Create / Edit ──────────────────────────────── */
function CategoryDrawer({ open, onClose, categories, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');

  // Reset form when drawer opens
  const handleOpen = () => {
    if (isEdit) {
      setName(editItem.name);
      setParentId(editItem.parentId ? String(editItem.parentId) : '');
    } else {
      setName('');
      setParentId('');
    }
  };

  // Reset on open change
  useState(() => { handleOpen(); });

  // Also reset when editItem changes
  if (open && isEdit && name === '' && editItem.name) {
    setName(editItem.name);
    setParentId(editItem.parentId ? String(editItem.parentId) : '');
  }

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create category'),
  });

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: (data) => updateCategory(editItem.id, data),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update category'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim() };
    if (parentId) payload.parentId = parseInt(parentId);
    if (isEdit) doUpdate(payload);
    else doCreate(payload);
  };

  const handleClose = () => {
    setName('');
    setParentId('');
    onClose();
  };

  const isPending = creating || updating;

  // Flatten parent options — only show top-level categories (not editing self)
  const parentOptions = (categories || []).filter(c => !isEdit || c.id !== editItem?.id);

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Category' : 'New Category'}
      subtitle={isEdit ? `Editing "${editItem?.name}"` : 'Add a new category or sub-category'}
      width="400px"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Category Name *">
          <input
            style={fieldStyle}
            placeholder="e.g. E-Commerce"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </Field>

        <Field label="Parent Category">
          <select style={fieldStyle} value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">None (top-level)</option>
            {parentOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Leave empty for a top-level group, or select a parent to create a sub-category.
          </p>
        </Field>

        <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="submit" disabled={isPending || !name.trim()} size="sm">
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Category')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function CategoriesPage() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const openCreate = () => { setEditItem(null); setDrawerOpen(true); };
  const openEdit = (item) => { setEditItem(item); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditItem(null); };

  const totalChildren = categories?.reduce((sum, p) => sum + (p.children?.length || 0), 0) || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Lead Categories</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {categories?.length || 0} groups · {totalChildren} sub-categories
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={13} /> Add Category
        </Button>
      </div>

      {/* Categories Table */}
      {categories?.length > 0 ? (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

          {/* Table header */}
          <div className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr 2fr auto',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-2)',
            }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Category</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Sub-categories</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Actions</span>
          </div>

          {/* Rows */}
          {categories.map((parent, i) => (
            <div key={parent.id}
              className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: '1fr 2fr auto',
                borderBottom: i < categories.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
              {/* Parent name */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" 
                  style={{ background: '#6366F115', color: '#818CF8' }}>
                  <FolderOpen size={13} />
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {parent.name}
                </span>
              </div>

              {/* Children pills */}
              <div className="flex flex-wrap gap-1.5">
                {parent.children?.length > 0 ? (
                  parent.children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => openEdit(child)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] transition-colors"
                      style={{
                        background: '#818CF812',
                        color: '#818CF8',
                        border: '1px solid #818CF825',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#818CF850'; e.currentTarget.style.background = '#818CF820'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#818CF825'; e.currentTarget.style.background = '#818CF812'; }}
                    >
                      {child.name}
                      <Pencil size={10} style={{ opacity: 0.5 }} />
                    </button>
                  ))
                ) : (
                  <span className="text-[11.5px]" style={{ color: 'var(--text-disabled)' }}>No sub-categories</span>
                )}
              </div>

              {/* Edit parent */}
              <button
                onClick={() => openEdit(parent)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Pencil size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <FolderOpen size={32} style={{ color: 'var(--text-disabled)', margin: '0 auto 8px' }} />
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>No categories yet</p>
          <p className="text-[11.5px] mt-1 mb-4" style={{ color: 'var(--text-disabled)' }}>
            Create your first category to start organizing leads
          </p>
          <Button size="sm" onClick={openCreate}>
            <Plus size={13} /> Add Category
          </Button>
        </div>
      )}

      {/* Drawer */}
      <CategoryDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        categories={categories}
        editItem={editItem}
      />
    </div>
  );
}
