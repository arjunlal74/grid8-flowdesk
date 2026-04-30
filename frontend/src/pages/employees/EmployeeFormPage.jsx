import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createEmployee } from '../../api/employees.api.js';
import Input, { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { role: 'MEMBER', isActive: true } });

  const { mutate, isPending } = useMutation({
    mutationFn: createEmployee,
    onSuccess: (e) => { toast.success('Employee created'); navigate(`/employees/${e.id}`); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create employee'),
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/employees')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Employees</button>
        <h1 className="text-[22px] font-semibold text-text-primary">New Employee</h1>
      </div>

      <form onSubmit={handleSubmit(mutate)} className="bg-bg-surface border rounded-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Full Name *" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName', { required: 'Required' })} />
          </div>
          <Input label="Email *" type="email" placeholder="john@company.com" error={errors.email?.message} {...register('email', { required: 'Required' })} />
          <Input
            label="Password *"
            type="password"
            placeholder="Min 8 chars, must include letter + number"
            error={errors.password?.message}
            {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
          />
          <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />
          <Select label="Role *" {...register('role')}>
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Input label="Designation" placeholder="Sales Manager" {...register('designation')} />
          <Input label="Department" placeholder="Sales" {...register('department')} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create Employee'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
