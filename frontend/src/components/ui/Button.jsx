export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-3.5 py-1.5 text-[12.5px]',
    lg: 'px-4 py-2 text-[13px]',
  };
  const variants = {
    primary: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90',
    secondary: 'bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)]',
    outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
