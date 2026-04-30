export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: isActive ? 'var(--bg-surface-2)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
