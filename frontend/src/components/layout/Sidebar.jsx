import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CheckSquare, FolderKanban,
  Briefcase, Settings, Grid2X2, CalendarClock, StickyNote
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/employees', icon: Briefcase, label: 'Employees' },
  { to: '/attendance', icon: CalendarClock, label: 'Attendance' },
];

const memberNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/attendance', icon: CalendarClock, label: 'Attendance' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const navItems = user?.role === 'ADMIN' ? adminNav : memberNav;

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-20"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 flex-shrink-0" style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--text-primary)' }}>
          <Grid2X2 size={13} style={{ color: 'var(--bg-base)' }} />
        </div>
        <span className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>Grid8</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                isActive
                  ? 'text-[var(--text-primary)] bg-[var(--bg-surface-2)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
              }`
            }
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <NavLink to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                isActive
                  ? 'text-[var(--text-primary)] bg-[var(--bg-surface-2)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
              }`
            }
          >
            <Settings size={14} strokeWidth={1.8} />
            Settings
          </NavLink>
        )}
      </nav>

    </aside>
  );
}
