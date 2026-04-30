import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createLead } from '../../api/leads.api.js';
import { getLeadStatuses, getCategories, getTags } from '../../api/settings.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  contactName: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  statusId: z.coerce.number().int().positive('Required'),
  categoryId: z.coerce.number().int().positive().optional(),
  source: z.string().default('OTHER'),
  priority: z.string().default('MEDIUM'),
  estimatedValue: z.coerce.number().optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
});

export default function LeadFormPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const defaultStatusId = sp.get('statusId');

  const { data: statuses } = useQuery({ queryKey: ['lead-statuses'], queryFn: getLeadStatuses });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { statusId: defaultStatusId ? parseInt(defaultStatusId) : undefined, priority: 'MEDIUM', source: 'OTHER' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createLead,
    onSuccess: (lead) => { toast.success('Lead created'); navigate(`/leads/${lead.id}`); },
    onError: () => toast.error('Failed to create lead'),
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/leads')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Leads</button>
        <h1 className="text-[22px] font-semibold text-text-primary">New Lead</h1>
      </div>

      <form onSubmit={handleSubmit(mutate)} className="bg-bg-surface border rounded-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Contact Name *" placeholder="John Doe" error={errors.contactName?.message} {...register('contactName')} />
          </div>
          <Input label="Company" placeholder="Acme Corp" {...register('companyName')} />
          <Input label="Email" type="email" placeholder="john@acme.com" {...register('email')} />
          <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />

          <Select label="Status *" error={errors.statusId?.message} {...register('statusId')}>
            <option value="">Select status</option>
            {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>

          <Select label="Category" {...register('categoryId')}>
            <option value="">No category</option>
            {categories?.map(parent => (
              <optgroup key={parent.id} label={parent.name}>
                {parent.children?.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
              </optgroup>
            ))}
          </Select>

          <Select label="Source" {...register('source')}>
            {['REFERRAL','COLD_CALL','COLD_EMAIL','WHATSAPP','LINKEDIN','INSTAGRAM','WEBSITE','EVENT','WALK_IN','OTHER'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </Select>

          <Select label="Priority" {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>

          <Input label="Estimated Value (₹)" type="number" placeholder="100000" {...register('estimatedValue')} />

          <Select label="Owner" {...register('ownerId')}>
            <option value="">Assign to me</option>
            {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>

          <div className="col-span-2">
            <Textarea label="Notes" placeholder="Add any notes about this lead…" {...register('description')} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create Lead'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/leads')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
