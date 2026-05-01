import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getSettings, updateSettings } from '../../api/settings.api.js';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const NAV = [
  { to: '/settings', label: 'Organization', end: true },
  { to: '/settings/leads', label: 'Lead Settings' },
  { to: '/settings/tasks', label: 'Task Settings' },
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
    <div>
      <div className="mb-5">
        <h1 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Organization</h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Core settings for your workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(mutate)}>
        <div className="rounded-xl overflow-hidden mb-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'orgName', label: 'Organization Name', placeholder: 'Grid8' },
            { key: 'defaultCurrency', label: 'Default Currency', placeholder: 'INR' },
            { key: 'timezone', label: 'Timezone', placeholder: 'Asia/Kolkata' },
          ].map((field, i, arr) => (
            <div key={field.key}
              className="grid items-center px-4 py-3.5"
              style={{
                gridTemplateColumns: '180px 1fr',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
              <label className="text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {field.label}
              </label>
              <input style={{ ...fieldStyle, maxWidth: '400px' }} placeholder={field.placeholder} {...register(field.key)} />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
