import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLead } from '../../api/leads.api.js';
import { getLeadStatuses, getCategories } from '../../api/settings.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  contactName: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  statusId: z.coerce.number().int().positive('Required'),
  categoryId: z.coerce.number().int().positive().optional(),
  source: z.string().default('OTHER'),
  priority: z.string().default('MEDIUM'),
  estimatedValue: z.coerce.number().optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
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

export default function NewLeadDrawer({ open, onClose, defaultStatusId }) {
  const qc = useQueryClient();
  const { data: statuses } = useQuery({ queryKey: ['lead-statuses'], queryFn: getLeadStatuses });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      statusId: defaultStatusId || '',
      priority: 'MEDIUM',
      source: 'OTHER',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createLead,
    onSuccess: (lead) => {
      toast.success(`Lead "${lead.contactName}" created`);
      qc.invalidateQueries({ queryKey: ['leads'] });
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to create lead'),
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Drawer open={open} onClose={handleClose} title="New Lead" subtitle="Add a new lead to the pipeline" width="460px">
      <form onSubmit={handleSubmit(mutate)} className="space-y-5">

        {/* Contact */}
        <div className="space-y-3">
          <SectionLabel>Contact</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full Name *" error={errors.contactName?.message}>
                <input style={fieldStyle} placeholder="Jane Smith" {...register('contactName')} />
              </Field>
            </div>
            <Field label="Company">
              <input style={fieldStyle} placeholder="Acme Corp" {...register('companyName')} />
            </Field>
            <Field label="Phone">
              <input style={fieldStyle} placeholder="+91 98765 43210" {...register('phone')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input style={fieldStyle} type="email" placeholder="jane@acme.com" {...register('email')} />
            </Field>
          </div>
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
            <Field label="Category">
              <select style={fieldStyle} {...register('categoryId')}>
                <option value="">No category</option>
                {categories?.map(p => (
                  <optgroup key={p.id} label={p.name}>
                    {p.children?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select style={fieldStyle} {...register('source')}>
                {['REFERRAL','COLD_CALL','COLD_EMAIL','WHATSAPP','LINKEDIN','INSTAGRAM','WEBSITE','EVENT','WALK_IN','OTHER']
                  .map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Commercial */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Commercial</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated Value (₹)">
              <input style={fieldStyle} type="number" placeholder="50000" {...register('estimatedValue')} />
            </Field>
            <Field label="Owner">
              <select style={fieldStyle} {...register('ownerId')}>
                <option value="">Assign to me</option>
                {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <SectionLabel>Notes</SectionLabel>
          <Field label="Description">
            <textarea
              style={{ ...fieldStyle, resize: 'none', minHeight: '72px' }}
              placeholder="Any notes about this lead…"
              rows={3}
              {...register('description')}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Creating…' : 'Create Lead'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>

      </form>
    </Drawer>
  );
}
