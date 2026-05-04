import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNote, deleteNote } from '../../api/notes.api.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CardMenu({ isColored, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const iconColor = isColored ? 'rgba(0,0,0,0.4)' : 'var(--text-tertiary)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ padding: '3px', borderRadius: '50%', color: iconColor, background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 0 }}
        onMouseEnter={e => e.currentTarget.style.background = isColored ? 'rgba(0,0,0,0.1)' : 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 20, minWidth: '130px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.45)', padding: '4px', marginBottom: '4px' }}>
          {[
            { label: 'Edit', icon: Pencil, action: onEdit },
            { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
          ].map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); action(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', borderRadius: '7px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--text-secondary)', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.08)' : 'var(--bg-surface-2)'; e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)'; }}
            >
              <Icon size={12} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoteCard({ note, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qc = useQueryClient();

  const isColored = !!note.color;
  const cardBg = note.color ?? 'var(--bg-surface-2)';
  const textTitle = isColored ? '#111' : 'var(--text-primary)';
  const textBody  = isColored ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)';
  const textMeta  = isColored ? 'rgba(0,0,0,0.38)' : 'var(--text-tertiary)';
  const lineColor = isColored ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)';

  const { mutate: toggleItem } = useMutation({
    mutationFn: ({ itemId, isDone }) =>
      updateNote(note.id, {
        items: note.items.map(it => ({ text: it.text, isDone: it.id === itemId ? isDone : it.isDone, position: it.position })),
      }),
    onMutate: async ({ itemId, isDone }) => {
      await qc.cancelQueries({ queryKey: ['notes'] });
      const prev = qc.getQueryData(['notes']);
      qc.setQueryData(['notes'], old =>
        old?.map(n => n.id === note.id
          ? { ...n, items: n.items.map(it => it.id === itemId ? { ...it, isDone } : it) }
          : n
        )
      );
      return { prev };
    },
    onError: (_, __, ctx) => qc.setQueryData(['notes'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); setConfirmDelete(false); },
  });

  const previewItems = note.items?.slice(0, 4) ?? [];
  const extraCount = (note.items?.length ?? 0) - 4;

  return (
    <>
      <div
        onClick={() => onEdit(note)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          height: '190px',
          background: cardBg,
          borderRadius: '10px',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.15s, box-shadow 0.15s',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered
            ? (isColored ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.4)')
            : (isColored ? '2px 4px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.25)'),
        }}
      >
        {/* Ruled notebook lines overlay */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, top: '36px',
          backgroundImage: `repeating-linear-gradient(transparent, transparent 23px, ${lineColor} 23px, ${lineColor} 24px)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Top strip — like a notebook header / colored tab */}
        <div style={{
          height: '5px',
          background: isColored ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.05)',
          flexShrink: 0,
        }} />

        {/* Content */}
        <div style={{ flex: 1, padding: '10px 12px 6px', overflow: 'hidden', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {note.title && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: textTitle, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {note.title}
            </div>
          )}

          {note.type === 'NOTE' && note.body && (
            <div style={{ fontSize: '12px', color: textBody, lineHeight: '24px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-wrap' }}>
              {note.body}
            </div>
          )}

          {note.type === 'CHECKLIST' && note.items?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {previewItems.map((item) => (
                <div key={item.id} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '7px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={(e) => toggleItem({ itemId: item.id, isDone: e.target.checked })}
                    style={{ width: '12px', height: '12px', flexShrink: 0, cursor: 'pointer', accentColor: isColored ? '#1a1a1a' : 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '12px', color: textBody, textDecoration: item.isDone ? 'line-through' : 'none', opacity: item.isDone ? 0.45 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.text}
                  </span>
                </div>
              ))}
              {extraCount > 0 && (
                <div style={{ paddingLeft: '19px', fontSize: '11px', color: textMeta, height: '24px', display: 'flex', alignItems: 'center' }}>
                  +{extraCount} more
                </div>
              )}
            </div>
          )}

          {!note.title && !note.body && note.items?.length === 0 && (
            <span style={{ fontSize: '12px', color: textMeta, fontStyle: 'italic' }}>Empty note</span>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px 8px',
          position: 'relative', zIndex: 1,
        }}>
          <span style={{ fontSize: '10px', color: textMeta, opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s' }}>
            {timeAgo(note.updatedAt)}
          </span>
          <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: hovered ? 'auto' : 'none' }}>
            <CardMenu isColored={isColored} onEdit={() => onEdit(note)} onDelete={() => setConfirmDelete(true)} />
          </div>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete note" size="sm">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Delete this note? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="danger" size="sm" onClick={() => doDelete()} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
