import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between py-2.5 px-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] px-2" style={{ color: 'var(--text-tertiary)' }}>{page} / {totalPages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-secondary)' }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
