import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployee, uploadEmployeeAvatar } from '../../api/employees.api.js';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fieldStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '12.5px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-widest pt-1"
      style={{ color: 'var(--text-tertiary)' }}>{children}</p>
  );
}

function AvatarPicker({ preview, initials, onChange, onClear }) {
  const inputRef = useRef(null);

  return (
    <div className="flex items-center gap-4">
      {/* Circle preview */}
      <div className="relative flex-shrink-0">
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-default)' }}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-semibold select-none" style={{ color: 'var(--text-tertiary)' }}>
              {initials || '?'}
            </span>
          )}
        </div>

        {/* Camera badge */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--text-primary)', color: 'var(--accent-fg)', border: '2px solid var(--bg-surface)' }}
        >
          <Camera size={10} strokeWidth={2.5} />
        </button>

        {/* Clear button */}
        {preview && (
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--danger)', color: '#fff', border: '1.5px solid var(--bg-surface)' }}
          >
            <X size={8} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>Profile photo</p>
        <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG or WebP</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1 text-[11.5px] font-medium px-2.5 py-1 rounded-lg self-start"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
        >
          {preview ? 'Change photo' : 'Upload photo'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

export default function NewEmployeeDrawer({ open, onClose }) {
  const qc = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [watchedName, setWatchedName] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'MEMBER' },
  });

  const fullNameValue = watch('fullName', '');
  const initials = fullNameValue
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '';

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAvatar = () => { setAvatarPreview(null); setAvatarFile(null); };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      let avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadEmployeeAvatar(avatarFile);
        avatarUrl = uploaded.url;
      }
      return createEmployee({ ...data, ...(avatarUrl && { avatarUrl }) });
    },
    onSuccess: (emp) => {
      toast.success(`Employee "${emp.fullName}" created`);
      qc.invalidateQueries({ queryKey: ['employees'] });
      reset();
      clearAvatar();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create employee'),
  });

  const handleClose = () => { reset(); clearAvatar(); onClose(); };

  return (
    <Drawer open={open} onClose={handleClose} title="New Employee" subtitle="Add a new team member" width="460px">
      <form onSubmit={handleSubmit(mutate)} className="space-y-5">

        {/* Avatar */}
        <div className="space-y-3">
          <SectionLabel>Photo</SectionLabel>
          <AvatarPicker
            preview={avatarPreview}
            initials={initials}
            onChange={handleAvatarChange}
            onClear={clearAvatar}
          />
        </div>

        {/* Identity */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Identity</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full Name *" error={errors.fullName?.message}>
                <input style={fieldStyle} placeholder="John Doe"
                  {...register('fullName', { required: 'Required' })} />
              </Field>
            </div>
            <Field label="Email *" error={errors.email?.message}>
              <input style={fieldStyle} type="email" placeholder="john@company.com"
                {...register('email', { required: 'Required' })} />
            </Field>
            <Field label="Phone">
              <input style={fieldStyle} placeholder="+91 98765 43210" {...register('phone')} />
            </Field>
          </div>
        </div>

        {/* Account */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Account</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Password *" error={errors.password?.message}>
                <input style={fieldStyle} type="password" placeholder="Min 8 chars, letter + number"
                  {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
              </Field>
            </div>
            <Field label="Role *">
              <select style={fieldStyle} {...register('role')}>
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Work */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Work</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation">
              <input style={fieldStyle} placeholder="Sales Manager" {...register('designation')} />
            </Field>
            <Field label="Department">
              <input style={fieldStyle} placeholder="Sales" {...register('department')} />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Creating…' : 'Create Employee'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>

      </form>
    </Drawer>
  );
}
