import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, addMember, removeMember, updateProject } from '../../api/projects.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Drawer from '../ui/Drawer.jsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import { CalendarDays, Users, CheckSquare, Plus, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PLANNING: '#60A5FA',
  ACTIVE: '#4ADE80',
  ON_HOLD: '#FBBF24',
  COMPLETED: '#A1A1A1',
  ARCHIVED: '#6B6B6B',
};

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

function Section({ label, children }) {
  return (
    <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
      <p className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-[12.5px] text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '7px 10px',
  fontSize: '12.5px',
  outline: 'none',
};

function EditForm({ project, employees, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: project.name || '',
    code: project.code || '',
    status: project.status || 'ACTIVE',
    color: project.color || '#6366F1',
    managerId: project.managerId || '',
    startDate: toInputDate(project.startDate),
    endDate: toInputDate(project.endDate),
    description: project.description || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Name</label>
          <input style={fieldStyle} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Code</label>
          <input style={fieldStyle} value={form.code} onChange={e => set('code', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</label>
          <select style={fieldStyle} value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Manager</label>
          <select style={fieldStyle} value={form.managerId} onChange={e => set('managerId', e.target.value)}>
            <option value="">Unassigned</option>
            {employees?.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Color</label>
          <input type="color" style={{ ...fieldStyle, padding: '3px 6px', height: '34px', cursor: 'pointer' }}
            value={form.color} onChange={e => set('color', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Start Date</label>
          <input type="date" style={fieldStyle} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>End Date</label>
          <input type="date" style={fieldStyle} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Description</label>
          <textarea style={{ ...fieldStyle, resize: 'none', minHeight: '72px' }} rows={3}
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
        <button
          disabled={saving || !form.name.trim()}
          onClick={() => onSave(form)}
          className="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', cursor: 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-[12.5px] font-medium"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ProjectDetailDrawer({ projectId, open, onClose }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => { if (!open) { setEditing(false); setAddingMember(false); } }, [open]);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: open && !!projectId,
  });

  const { data: allEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: open && !!projectId,
  });

  const memberIds = new Set(project?.members?.map(m => m.employeeId));
  const availableEmployees = allEmployees?.filter(e => !memberIds.has(e.id)) || [];

  const { mutate: doUpdate, isPending: saving } = useMutation({
    mutationFn: (data) => updateProject(projectId, {
      ...data,
      managerId: data.managerId ? parseInt(data.managerId) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    }),
    onSuccess: () => {
      toast.success('Project updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to update project'),
  });

  const { mutate: doAddMember, isPending: adding } = useMutation({
    mutationFn: (employeeId) => addMember(projectId, { employeeId: parseInt(employeeId) }),
    onSuccess: () => {
      toast.success('Member added');
      setSelectedEmployeeId('');
      setAddingMember(false);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to add member'),
  });

  const { mutate: doRemoveMember } = useMutation({
    mutationFn: (employeeId) => removeMember(projectId, employeeId),
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const totalTasks = project?.tasks?.length || 0;
  const doneTasks = project?.tasks?.filter(t => t.status?.isDone).length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const color = project?.color || '#6366F1';

  return (
    <Drawer open={open} onClose={onClose} title="Project Details" width="440px">
      {isLoading && (
        <div className="text-[12px] pt-4" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      )}

      {!isLoading && project && (
        <div className="space-y-5" style={{ marginTop: '-16px', marginLeft: '-20px', marginRight: '-20px' }}>

          {/* Colored banner */}
          <div style={{
            background: `linear-gradient(135deg, ${color}28 0%, ${color}10 100%)`,
            borderBottom: `1px solid ${color}30`,
            borderLeft: `4px solid ${color}`,
            padding: '16px 16px 16px 16px',
          }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h2>
                {project.code && (
                  <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{project.code}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <Badge color={STATUS_COLORS[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <button
                  onClick={() => setEditing(e => !e)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: editing ? 'var(--text-primary)' : 'var(--text-tertiary)', background: editing ? 'var(--bg-surface-2)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (!editing) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}
                  title="Edit project"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {!editing && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Users size={11} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare size={11} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                  </span>
                </div>
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={11} style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                      {fmt(project.startDate)} → {fmt(project.endDate)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-5 px-5">

            {/* Edit form */}
            {editing ? (
              <EditForm
                project={project}
                employees={allEmployees}
                saving={saving}
                onSave={doUpdate}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                {/* Description */}
                {project.description && (
                  <Section label="Description">
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {project.description}
                    </p>
                  </Section>
                )}

                {/* Details */}
                <Section label="Details">
                  <div className="space-y-2.5">
                    {project.manager && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Manager</span>
                        <div className="flex items-center gap-2">
                          <Avatar name={project.manager.fullName} size="xs" />
                          <span className="text-[12.5px]" style={{ color: 'var(--text-primary)' }}>
                            {project.manager.fullName}
                          </span>
                        </div>
                      </div>
                    )}
                    <InfoRow label="Start Date" value={project.startDate ? fmt(project.startDate) : null} />
                    <InfoRow label="End Date" value={project.endDate ? fmt(project.endDate) : null} />
                  </div>
                </Section>

                {/* Tasks */}
                {totalTasks > 0 && (
                  <Section label={`Tasks · ${doneTasks}/${totalTasks} done`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#4ADE80', transition: 'width 400ms' }} />
                      </div>
                      <span className="text-[11.5px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{progress}%</span>
                    </div>
                    <div className="space-y-1.5">
                      {project.tasks?.map(task => (
                        <div key={task.id}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                          style={{ background: 'var(--bg-surface-2)' }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: task.status?.color || 'var(--border-default)' }} />
                          <span className="text-[12px] flex-1 truncate"
                            style={{
                              color: task.status?.isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                              textDecoration: task.status?.isDone ? 'line-through' : 'none',
                            }}>
                            {task.title}
                          </span>
                          {task.assignee && <Avatar name={task.assignee.fullName} size="xs" />}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Members */}
                <Section label={`Members · ${project.members?.length || 0}`}>
                  <div className="space-y-1.5">
                    {project.members?.map(m => (
                      <div key={m.employeeId}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg group"
                        style={{ background: 'var(--bg-surface-2)' }}>
                        <Avatar name={m.employee.fullName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            {m.employee.fullName}
                          </p>
                          {m.role && (
                            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{m.role}</p>
                          )}
                        </div>
                        <button
                          onClick={() => doRemoveMember(m.employeeId)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-tertiary)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                          title="Remove member"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {!project.members?.length && (
                      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No members yet.</p>
                    )}
                  </div>

                  {addingMember ? (
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={selectedEmployeeId}
                        onChange={e => setSelectedEmployeeId(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-default)',
                          color: selectedEmployeeId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12.5px',
                          outline: 'none',
                        }}
                      >
                        <option value="">Select employee…</option>
                        {availableEmployees.map(e => (
                          <option key={e.id} value={e.id}>{e.fullName}</option>
                        ))}
                      </select>
                      <button
                        disabled={!selectedEmployeeId || adding}
                        onClick={() => doAddMember(selectedEmployeeId)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-40"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', cursor: 'pointer' }}
                      >
                        {adding ? '…' : 'Add'}
                      </button>
                      <button
                        onClick={() => { setAddingMember(false); setSelectedEmployeeId(''); }}
                        className="p-1.5 rounded-lg"
                        style={{ color: 'var(--text-tertiary)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingMember(true)}
                      className="flex items-center gap-1.5 mt-2 text-[12px] font-medium"
                      style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    >
                      <Plus size={13} /> Add member
                    </button>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
