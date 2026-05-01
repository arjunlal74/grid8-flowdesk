import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function AssigneeMultiSelect({ employees = [], value = [], onChange, placeholder = 'Assign to me' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = employees.filter(e => value.includes(e.id));
  const filtered = employees.filter(e =>
    !query || e.fullName.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter(v => v !== id));
    else onChange([...value, id]);
  };

  const remove = (id) => onChange(value.filter(v => v !== id));

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 flex-wrap text-left"
        style={{
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          borderRadius: '8px',
          padding: selected.length ? '5px 28px 5px 6px' : '7px 28px 7px 12px',
          fontSize: '12.5px',
          minHeight: '34px',
          cursor: 'pointer',
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: 'var(--text-tertiary)' }}>{placeholder}</span>
        ) : (
          selected.map(emp => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              onClick={e => e.stopPropagation()}
            >
              <Avatar name={emp.fullName} size="xs" />
              <span style={{ fontSize: '11.5px' }}>{emp.fullName}</span>
              <button
                type="button"
                onClick={() => remove(emp.id)}
                className="ml-0.5 p-0.5 rounded"
                style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={13}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 left-0 right-0 rounded-lg overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employees…"
            className="w-full text-[12px] outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
            }}
          />
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                No matches
              </div>
            )}
            {filtered.map(emp => {
              const isSelected = value.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors"
                  style={{
                    background: isSelected ? 'var(--bg-surface-2)' : 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar name={emp.fullName} size="xs" />
                  <span className="text-[12.5px] flex-1">{emp.fullName}</span>
                  {isSelected && <Check size={13} style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
