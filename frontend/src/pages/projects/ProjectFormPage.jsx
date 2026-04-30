import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProject } from '../../api/projects.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { status: 'ACTIVE', color: '#FFFFFF' } });

  const { mutate, isPending } = useMutation({
    mutationFn: createProject,
    onSuccess: (p) => { toast.success('Project created'); navigate(`/projects/${p.id}`); },
    onError: () => toast.error('Failed to create project'),
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/projects')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Projects</button>
        <h1 className="text-[22px] font-semibold text-text-primary">New Project</h1>
      </div>

      <form onSubmit={handleSubmit(mutate)} className="bg-bg-surface border rounded-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Project Name *" placeholder="My Project" {...register('name', { required: 'Required' })} error={errors.name?.message} />
          </div>
          <Input label="Code" placeholder="GR-001" {...register('code')} />
          <Select label="Status" {...register('status')}>
            {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </Select>
          <Input label="Start Date" type="date" {...register('startDate')} />
          <Input label="End Date" type="date" {...register('endDate')} />
          <Select label="Manager" {...register('managerId')}>
            <option value="">Unassigned</option>
            {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary">Color</label>
            <input type="color" className="h-10 w-full rounded-lg border cursor-pointer bg-bg-surface-2" {...register('color')} />
          </div>
          <div className="col-span-2">
            <Textarea label="Description" placeholder="What is this project about?" {...register('description')} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create Project'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
