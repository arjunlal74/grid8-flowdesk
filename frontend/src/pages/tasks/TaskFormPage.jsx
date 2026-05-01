import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTask } from '../../api/tasks.api.js';
import { getTaskStatuses } from '../../api/settings.api.js';
import { getEmployees } from '../../api/employees.api.js';
import { getProjects } from '../../api/projects.api.js';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import AssigneeMultiSelect from '../../components/ui/AssigneeMultiSelect.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  statusId: z.coerce.number().int().positive('Required'),
  priority: z.string().default('MEDIUM'),
  projectId: z.coerce.number().int().positive().optional(),
  assigneeIds: z.array(z.number()).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
});

export default function TaskFormPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const defaultStatusId = sp.get('statusId');

  const { data: statuses } = useQuery({ queryKey: ['task-statuses'], queryFn: getTaskStatuses });
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { statusId: defaultStatusId ? parseInt(defaultStatusId) : undefined, priority: 'MEDIUM', assigneeIds: [] },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createTask,
    onSuccess: (task) => { toast.success('Task created'); navigate(`/tasks/${task.id}`); },
    onError: () => toast.error('Failed to create task'),
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/tasks')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Tasks</button>
        <h1 className="text-[22px] font-semibold text-text-primary">New Task</h1>
      </div>

      <form onSubmit={handleSubmit(mutate)} className="bg-bg-surface border rounded-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Title *" placeholder="Task title" error={errors.title?.message} {...register('title')} />
          </div>
          <Select label="Status *" error={errors.statusId?.message} {...register('statusId')}>
            <option value="">Select status</option>
            {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Priority" {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
          <Select label="Project" {...register('projectId')}>
            <option value="">No project</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="col-span-2">
            <label className="block text-[12px] mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Assignees</label>
            <Controller
              control={control}
              name="assigneeIds"
              render={({ field }) => (
                <AssigneeMultiSelect
                  employees={employees || []}
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <Input label="Due Date" type="date" {...register('dueDate')} />
          <Input label="Estimated Hours" type="number" step="0.5" {...register('estimatedHours')} />
          <div className="col-span-2">
            <Textarea label="Description" placeholder="Describe the task…" {...register('description')} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create Task'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/tasks')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
