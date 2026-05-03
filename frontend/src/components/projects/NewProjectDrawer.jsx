import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../../api/projects.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import AssigneeMultiSelect from '../ui/AssigneeMultiSelect.jsx';
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

export default function NewProjectDrawer({ open, onClose }) {
  const qc = useQueryClient();
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { status: 'ACTIVE', color: '#6366F1', memberIds: [] },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => createProject({
      ...data,
      memberIds: (data.memberIds || []).map((id) => parseInt(id, 10)),
    }),
    onSuccess: (p) => {
      toast.success(`Project "${p.name}" created`);
      qc.invalidateQueries({ queryKey: ['projects'] });
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to create project'),
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Drawer open={open} onClose={handleClose} title="New Project" subtitle="Create a new project" width="460px">
      <form onSubmit={handleSubmit(mutate)} className="space-y-5">

        {/* Details */}
        <div className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Project Name *" error={errors.name?.message}>
                <input style={fieldStyle} placeholder="My Project"
                  {...register('name', { required: 'Required' })} />
              </Field>
            </div>
            <Field label="Code">
              <input style={fieldStyle} placeholder="GR-001" {...register('code')} />
            </Field>
            <Field label="Status">
              <select style={fieldStyle} {...register('status')}>
                {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Team */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Team</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Manager">
              <select style={fieldStyle} {...register('managerId')}>
                <option value="">Unassigned</option>
                {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </Field>
            <Field label="Color">
              <input type="color" style={{ ...fieldStyle, padding: '4px 8px', height: '34px', cursor: 'pointer' }}
                {...register('color')} />
            </Field>
            <div className="col-span-2">
              <Field label="Members">
                <Controller
                  control={control}
                  name="memberIds"
                  render={({ field }) => (
                    <AssigneeMultiSelect
                      employees={employees || []}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add team members"
                    />
                  )}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Timeline</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input style={fieldStyle} type="date" {...register('startDate')} />
            </Field>
            <Field label="End Date">
              <input style={fieldStyle} type="date" {...register('endDate')} />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Notes</SectionLabel>
          <Field label="Description">
            <textarea
              style={{ ...fieldStyle, resize: 'none', minHeight: '72px' }}
              placeholder="What is this project about?"
              rows={3}
              {...register('description')}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Creating…' : 'Create Project'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>

      </form>
    </Drawer>
  );
}
