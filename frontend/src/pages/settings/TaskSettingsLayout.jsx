import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/settings/tasks', label: 'Task Statuses', end: true },
];

export default function TaskSettingsLayout() {
  return (
    <div>
      <div className="mb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <nav className="flex gap-6">
          {TABS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className="pb-3 text-[13px] font-medium transition-colors"
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
              })}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
