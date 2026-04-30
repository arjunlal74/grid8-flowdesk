import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../../api/tasks.api.js';
import { getTaskStatuses } from '../../api/settings.api.js';
import { getEmployees } from '../../api/employees.api.js';
import { getProjects } from '../../api/projects.api.js';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  statusId: z.coerce.number().int().positive('Required'),
  priority: z.string().default('MEDIUM'),
  projectId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
});

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

export default function NewTaskDrawer({ open, onClose, defaultStatusId }) {
  const qc = useQueryClient();
  const { data: statuses } = useQuery({ queryKey: ['task-statuses'], queryFn: getTaskStatuses });
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      statusId: defaultStatusId || '',
      priority: 'MEDIUM',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      toast.success(`Task "${task.title}" created`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to create task'),
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Drawer open={open} onClose={handleClose} title="New Task" subtitle="Add a new task to your workflow" width="460px">
      <form onSubmit={handleSubmit(mutate)} className="space-y-5">

        {/* Details */}
        <div className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <Field label="Title *" error={errors.title?.message}>
            <input style={fieldStyle} placeholder="Task title" {...register('title')} />
          </Field>
        </div>

        {/* Classification */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Classification</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status *" error={errors.statusId?.message}>
              <select style={fieldStyle} {...register('statusId')}>
                <option value="">Select…</option>
                {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select style={fieldStyle} {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>
            <Field label="Project">
              <select style={fieldStyle} {...register('projectId')}>
                <option value="">No project</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Assignee">
              <select style={fieldStyle} {...register('assigneeId')}>
                <option value="">Assign to me</option>
                {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Scheduling</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due Date">
              <input style={fieldStyle} type="date" {...register('dueDate')} />
            </Field>
            <Field label="Estimated Hours">
              <input style={fieldStyle} type="number" step="0.5" placeholder="2.5" {...register('estimatedHours')} />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Notes</SectionLabel>
          <Field label="Description">
            <textarea
              style={{ ...fieldStyle, resize: 'none', minHeight: '72px' }}
              placeholder="Describe the task…"
              rows={3}
              {...register('description')}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Creating…' : 'Create Task'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>

      </form>
    </Drawer>
  );
}
