import { createPortal } from 'react-dom';
import { X, FileText, CheckSquare } from 'lucide-react';
import { useEffect } from 'react';

export default function NoteTypePickerModal({ open, onClose, onPick }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const types = [
    {
      type: 'NOTE',
      icon: FileText,
      label: 'Note',
      description: 'Title and freeform text',
    },
    {
      type: 'CHECKLIST',
      icon: CheckSquare,
      label: 'Checklist',
      description: 'Title and to-do items',
    },
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '380px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Create note</h2>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {types.map(({ type, icon: Icon, label, description }) => (
            <button
              key={type}
              onClick={() => onPick(type)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-default)', background: 'var(--bg-surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
