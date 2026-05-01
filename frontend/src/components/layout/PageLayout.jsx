export default function PageLayout({ title, count, actions, tabs, children }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      {/* Page title row — part of content, not a sticky header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {count !== undefined && count !== null && (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                {count}
              </span>
            )}
          </div>
          {tabs && (
            <div className="flex items-center mt-0.5">{tabs}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page body */}
      <div className="flex-1 px-6 pb-6 space-y-4">
        {children}
      </div>
    </div>
  );
}
