import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Grid2X2, Eye, EyeOff, Users, FolderKanban, BarChart2, CheckSquare } from 'lucide-react';
import { login } from '../../api/auth.api.js';
import { useAuthStore } from '../../store/authStore.js';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

const features = [
  { icon: Users,        label: 'Team Management',   desc: 'Manage employees and roles' },
  { icon: FolderKanban, label: 'Project Tracking',  desc: 'Monitor progress in real time' },
  { icon: BarChart2,    label: 'Lead Pipeline',     desc: 'Track leads from contact to close' },
  { icon: CheckSquare,  label: 'Task Management',   desc: 'Assign and complete tasks easily' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => { setAuth(token, user); navigate('/dashboard'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed'),
  });

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel — branding ─────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Subtle grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(var(--border-subtle) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }} />

        {/* Radial fade over grid */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, var(--bg-surface) 80%)',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">

          {/* Big icon */}
          <div className="mb-8 relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'var(--text-primary)',
                boxShadow: '0 0 60px rgba(255,255,255,0.08)',
              }}
            >
              <Grid2X2 size={36} style={{ color: 'var(--bg-base)' }} />
            </div>
            <div style={{
              position: 'absolute', inset: '-12px', borderRadius: '28px',
              border: '1px solid var(--border-default)', opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute', inset: '-24px', borderRadius: '36px',
              border: '1px solid var(--border-subtle)', opacity: 0.3,
            }} />
          </div>

          <h2 className="text-[24px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            One platform.<br />Everything your team needs.
          </h2>
          <p className="text-[13px] mb-10" style={{ color: 'var(--text-tertiary)', maxWidth: '320px', lineHeight: '1.7' }}>
            Employees, projects, leads and tasks — all in one internal workspace built for your team.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '320px' }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <Icon size={13} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────── */}
      <div className="flex items-center justify-center" style={{ width: '45%', minWidth: '360px' }}>
        <div className="w-full flex flex-col" style={{ maxWidth: '340px', padding: '0 16px' }}>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--text-primary)' }}>
              <Grid2X2 size={14} style={{ color: 'var(--bg-base)' }} />
            </div>
            <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Grid8</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[22px] font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Welcome back
            </h1>
            <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(mutate)} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                placeholder="admin@grid8.local"
                autoComplete="email"
                style={inputStyle}
                {...register('email')}
              />
              {errors.email && <p className="text-[11px] mt-0.5" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] mt-0.5" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full font-semibold rounded-xl text-[13px] transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)', padding: '11px', marginTop: '2px' }}
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
