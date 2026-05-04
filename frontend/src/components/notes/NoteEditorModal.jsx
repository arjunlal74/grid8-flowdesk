import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '../../api/notes.api.js';

const PALETTE = [
  '#F28B82', '#FBBC04', '#FFF475', '#CCFF90',
  '#A8DAB5', '#CBF0F8', '#AECBFA', '#FDCFE8', '#E6C9A8',
];
export const randomNoteColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

const MONO = "'ui-monospace', 'SF Mono', 'Cascadia Code', 'Consolas', monospace";

function CircleCheck({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '19px', height: '19px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${checked ? 'var(--text-tertiary)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--text-tertiary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        marginTop: '2px',
      }}
    >
      {checked && <Check size={11} strokeWidth={2.5} style={{ color: 'var(--bg-surface)' }} />}
    </div>
  );
}

function ChecklistEditor({ items, onChange }) {
  const addItem   = () => onChange([...items, { text: '', isDone: false, position: items.length }]);
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const toggleItem = (i) => onChange(items.map((it, idx) => idx === i ? { ...it, isDone: !it.isDone } : it));
  const editText   = (i, text) => onChange(items.map((it, idx) => idx === i ? { ...it, text } : it));

  const done = items.filter(it => it.isDone).length;
  const pending = items.filter(it => !it.isDone);
  const completed = items.filter(it => it.isDone);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Pending items */}
      {pending.map((item) => {
        const realIdx = items.indexOf(item);
        return (
          <div
            key={realIdx}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}
            onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del'); if(btn) btn.style.opacity='1'; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del'); if(btn) btn.style.opacity='0'; }}
          >
            <CircleCheck checked={false} onChange={() => toggleItem(realIdx)} />
            <input
              value={item.text}
              onChange={(e) => editText(realIdx, e.target.value)}
              placeholder="Add item…"
              spellCheck={false}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13.5px', color: 'var(--text-primary)', fontFamily: MONO, lineHeight: 1.6 }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
            />
            <button className="del" onClick={() => removeItem(realIdx)}
              style={{ padding: '3px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 0, opacity: 0, transition: 'opacity 0.12s' }}>
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}

      {/* Add item */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '10px 0' }}>
        <div style={{ width: '19px', height: '19px', borderRadius: '50%', border: '1.5px dashed var(--border-default)', flexShrink: 0 }} />
        <button onClick={addItem}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: MONO, display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
          <Plus size={13} strokeWidth={2} /> Add item
        </button>
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: MONO, marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {done} completed
          </div>
          {completed.map((item) => {
            const realIdx = items.indexOf(item);
            return (
              <div key={realIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', padding: '6px 0', opacity: 0.45 }}>
                <CircleCheck checked={true} onChange={() => toggleItem(realIdx)} />
                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontFamily: MONO, lineHeight: 1.6, textDecoration: 'line-through' }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NoteEditorModal({ open, onClose, note, initialColor }) {
  const isEdit = !!note;
  const type   = note?.type ?? open;
  const color  = note?.color ?? initialColor ?? null;

  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? '');
      setBody(note?.body ?? '');
      setItems(note?.items ? note.items.map(it => ({ ...it })) : []);
    }
  }, [open, note]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => isEdit ? updateNote(note.id, data) : createNote(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); onClose(); },
  });

  const handleSave = () => {
    const base = isEdit ? {} : { type, color };
    if (type === 'NOTE') {
      mutate({ ...base, title: title || null, body: body || null });
    } else {
      mutate({
        ...base,
        title: title || null,
        items: items.map((it, i) => ({ text: it.text, isDone: it.isDone, position: i })).filter(it => it.text.trim()),
      });
    }
  };

  if (!open) return null;

  const completedCount = items.filter(it => it.isDone).length;
  const totalCount = items.length;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: '620px', maxHeight: '82vh',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'NOTE' ? 'Untitled note' : 'Untitled checklist'}
            spellCheck={false}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'inherit', lineHeight: 1.3,
            }}
          />
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {type === 'NOTE' ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing…"
              autoFocus={!isEdit}
              spellCheck={false}
              style={{
                width: '100%', minHeight: '280px', background: 'transparent',
                border: 'none', outline: 'none', resize: 'none',
                fontSize: '13.5px', color: 'var(--text-secondary)',
                fontFamily: MONO, lineHeight: 1.8,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <ChecklistEditor items={items} onChange={setItems} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '12px 24px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: MONO }}>
            {type === 'CHECKLIST'
              ? `${completedCount} of ${totalCount} completed`
              : (body.length > 0 ? `${body.split(/\s+/).filter(Boolean).length} words` : '')}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-default)', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{ padding: '7px 20px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
