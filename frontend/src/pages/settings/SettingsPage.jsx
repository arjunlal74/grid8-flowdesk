import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getSettings, updateSettings } from '../../api/settings.api.js';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const NAV = [
  { to: '/settings', label: 'Organization', end: true },
  { to: '/settings/lead-statuses', label: 'Lead Statuses' },
  { to: '/settings/task-statuses', label: 'Task Statuses' },
  { to: '/settings/categories', label: 'Categories' },
  { to: '/settings/tags', label: 'Tags' },
];

const fieldStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '12.5px',
  width: '100%',
  outline: 'none',
};

export default function SettingsPage() {
  const location = useLocation();
  const isRoot = location.pathname === '/settings';

  return (
    <div className="p-5 flex gap-6">
      <aside className="w-40 flex-shrink-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest px-2 mb-2"
          style={{ color: 'var(--text-tertiary)' }}>Settings</p>
        <nav className="space-y-0.5">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className="block px-3 py-2 rounded-lg text-[12.5px] transition-colors"
              style={({ isActive }) => ({
                background: isActive ? 'var(--bg-surface-2)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '500' : '400',
              })}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {isRoot ? <OrgSettings /> : <Outlet />}
      </div>
    </div>
  );
}

function OrgSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-[16px] font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Organization</h1>
      <form onSubmit={handleSubmit(mutate)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Organization Name</label>
          <input style={fieldStyle} {...register('orgName')} />
        </div>
        <div className="space-y-1">
          <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Default Currency</label>
          <input style={fieldStyle} {...register('defaultCurrency')} />
        </div>
        <div className="space-y-1">
          <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Timezone</label>
          <input style={fieldStyle} {...register('timezone')} />
        </div>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
