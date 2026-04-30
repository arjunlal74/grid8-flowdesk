const inputClass = (error) =>
  `w-full rounded-lg px-3 py-2 text-[12.5px] focus:outline-none transition-colors ${
    error
      ? 'border border-[var(--danger)]'
      : 'border border-[var(--border-default)] focus:border-[var(--border-strong)]'
  }`;

const inputStyle = { background: 'var(--bg-surface-2)', color: 'var(--text-primary)' };

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <input className={`${inputClass(error)} ${className}`} style={inputStyle} {...props} />
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <select className={`${inputClass(error)} ${className}`} style={inputStyle} {...props}>
        {children}
      </select>
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <textarea
        className={`${inputClass(error)} resize-none ${className}`}
        style={inputStyle}
        rows={4}
        {...props}
      />
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
