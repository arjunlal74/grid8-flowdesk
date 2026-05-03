import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

function InitialsAvatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10.5px] font-semibold"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
      {initials}
    </div>
  );
}

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSignOut = () => {
    setConfirmOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 z-[15] flex items-center justify-end px-5 gap-3"
      style={{
        left: '220px',
        height: '52px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        {theme === 'dark' ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>

      <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

      {/* User */}
      <div className="flex items-center gap-2">
        <InitialsAvatar name={user?.fullName} />
        <div>
          <p className="text-[11.5px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{user?.role}</p>
        </div>
      </div>

      <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

      {/* Sign out */}
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <LogOut size={13} strokeWidth={1.8} />
        Sign out
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Sign out?" size="sm">
        <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
          You'll be signed out and returned to the login screen. Any unsaved work in this tab may be lost.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            <LogOut size={12} /> Sign out
          </Button>
        </div>
      </Modal>
    </header>
  );
}
