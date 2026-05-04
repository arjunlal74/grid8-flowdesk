import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, StickyNote, Search, X } from 'lucide-react';
import { getNotes } from '../../api/notes.api.js';
import PageLayout from '../../components/layout/PageLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import NoteCard from '../../components/notes/NoteCard.jsx';
import NoteTypePickerModal from '../../components/notes/NoteTypePickerModal.jsx';
import NoteEditorModal, { randomNoteColor } from '../../components/notes/NoteEditorModal.jsx';

export default function NotesPage() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingColor, setPendingColor] = useState(null);
  const [search, setSearch] = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: getNotes,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n =>
      (n.title ?? '').toLowerCase().includes(q) ||
      (n.body ?? '').toLowerCase().includes(q) ||
      n.items?.some(it => it.text.toLowerCase().includes(q))
    );
  }, [notes, search]);

  const handlePick = (type) => {
    setPickerOpen(false);
    setEditingNote(null);
    setPendingColor(randomNoteColor());
    setEditorOpen(type);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setPendingColor(null);
    setEditorOpen(note.type);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingNote(null);
    setPendingColor(null);
  };

  const actions = (
    <Button size="sm" onClick={() => setPickerOpen(true)}>
      <Plus size={12} strokeWidth={2} /> New Note
    </Button>
  );

  return (
    <PageLayout title="Notes" count={notes.length || undefined} actions={actions}>
      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          style={{ width: '100%', paddingLeft: '34px', paddingRight: search ? '34px' : '12px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '12.5px', color: 'var(--text-primary)', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = 'var(--border-strong)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 0, padding: '2px' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '80px 0' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StickyNote size={24} style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {search ? 'No notes match your search' : 'No notes yet'}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
              {search ? 'Try a different keyword' : 'Tap + to create your first note'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 190px)', gap: '14px' }}>
          {filtered.map(note => (
            <NoteCard key={note.id} note={note} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <NoteTypePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />

      <NoteEditorModal
        open={editorOpen}
        onClose={handleEditorClose}
        note={editingNote}
        initialColor={pendingColor}
      />
    </PageLayout>
  );
}
