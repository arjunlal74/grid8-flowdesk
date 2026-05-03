import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTask, completeTask, getTaskComments, addTaskComment,
  addSubtask, updateSubtask, deleteSubtask,
} from '../../api/tasks.api.js';
import { getEmployees } from '../../api/employees.api.js';
import Badge, { PriorityBadge } from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import AvatarGroup from '../ui/AvatarGroup.jsx';
import Button from '../ui/Button.jsx';
import {
  CheckCircle, Send, X, User, Calendar, Clock, Trash2, Plus, Check,
  FolderKanban, Link2, CheckSquare, MessageSquare, AlignLeft, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'Overview',  icon: AlignLeft },
  { id: 'Comments',  icon: MessageSquare },
  { id: 'Subtasks',  icon: CheckSquare },
];

const PRIORITY_COLORS = {
  LOW: '#6B6B6B', MEDIUM: '#FBBF24', HIGH: '#F97316', URGENT: '#F87171',
};

function MetaCard({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <div className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {children || <span style={{ color: 'var(--text-disabled)' }}>—</span>}
      </div>
    </div>
  );
}

function PersonCard({ icon: Icon, label, name }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      {name ? (
        <div className="flex items-center gap-2">
          <Avatar name={name} size="xs" />
          <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{name}</span>
        </div>
      ) : (
        <span className="text-[12.5px]" style={{ color: 'var(--text-disabled)' }}>—</span>
      )}
    </div>
  );
}

function AssigneesCard({ assignees }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-1.5">
        <User size={11} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>Assignees</span>
      </div>
      {assignees?.length ? (
        <div className="flex flex-col gap-1">
          {assignees.map(a => (
            <div key={a.employee.id} className="flex items-center gap-2">
              <Avatar name={a.employee.fullName} size="xs" />
              <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {a.employee.fullName}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-[12.5px]" style={{ color: 'var(--text-disabled)' }}>—</span>
      )}
    </div>
  );
}

function MentionTextarea({ value, onChange, employees = [], onSubmit, ...props }) {
  const ref = useRef(null);
  const [popup, setPopup] = useState({ open: false, query: '', start: 0 });
  const [active, setActive] = useState(0);

  const detect = (text, caret) => {
    const before = text.slice(0, caret);
    const m = /(^|\s)@([\w.]*)$/.exec(before);
    if (!m) return null;
    return { query: m[2], start: caret - m[2].length - 1 };
  };

  const filtered = popup.open
    ? employees.filter((e) => e.fullName.toLowerCase().replace(/\s/g, '').includes(popup.query.toLowerCase().replace(/\s/g, ''))).slice(0, 6)
    : [];

  useEffect(() => { setActive(0); }, [popup.query, popup.open]);

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);
    const det = detect(text, e.target.selectionStart);
    if (det) setPopup({ open: true, query: det.query, start: det.start });
    else setPopup((p) => ({ ...p, open: false }));
  };

  const insertMention = (emp) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const slug = emp.fullName.replace(/\s+/g, '_');
    const before = value.slice(0, popup.start);
    const after = value.slice(caret);
    const newText = `${before}@${slug} ${after}`;
    onChange(newText);
    setPopup((p) => ({ ...p, open: false }));
    setTimeout(() => {
      el?.focus();
      const pos = (before + '@' + slug + ' ').length;
      el?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (popup.open && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % filtered.length); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => (a - 1 + filtered.length) % filtered.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filtered[active]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setPopup((p) => ({ ...p, open: false })); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
        className={`w-full ${props.className || ''}`}
      />
      {popup.open && filtered.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1.5 z-30 w-60 max-h-64 overflow-y-auto rounded-xl shadow-2xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Mention someone
          </div>
          {filtered.map((emp, idx) => (
            <button key={emp.id} type="button"
              onClick={() => insertMention(emp)}
              onMouseEnter={() => setActive(idx)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors"
              style={{
                background: active === idx ? 'var(--bg-surface-2)' : 'transparent',
                color: 'var(--text-primary)',
              }}>
              <Avatar name={emp.fullName} size="xs" />
              <span className="truncate flex-1">{emp.fullName}</span>
              {emp.designation && (
                <span className="text-[10.5px] truncate" style={{ color: 'var(--text-tertiary)' }}>{emp.designation}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentBody({ text, employees = [] }) {
  if (!text) return null;
  if (!employees.length) return <>{text}</>;
  const slugs = employees.map((e) => e.fullName.replace(/\s+/g, '_'));
  const slugByEmpId = new Map(employees.map((e) => [e.fullName.replace(/\s+/g, '_'), e]));
  const escaped = slugs.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  if (!escaped.length) return <>{text}</>;
  const re = new RegExp('@(' + escaped.join('|') + ')(?![\\w.])', 'g');
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const emp = slugByEmpId.get(m[1]);
    out.push(
      <span key={`${m.index}-${m[1]}`} className="font-medium px-1 rounded"
        style={{ background: 'var(--info)/15', color: 'var(--info)' }}>
        @{emp?.fullName || m[1].replace(/_/g, ' ')}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((part, i) => typeof part === 'string' ? <span key={`t-${i}`}>{part}</span> : part)}</>;
}

function AssigneePicker({ value = [], onChange, employees = [], compact = false }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const selected = employees.filter((e) => value.includes(e.id));
  const filtered = employees.filter((e) => e.fullName.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full transition-colors"
        style={{
          background: selected.length ? 'transparent' : 'var(--bg-surface)',
          color: selected.length ? 'var(--text-secondary)' : 'var(--text-tertiary)',
          border: `1px dashed ${selected.length ? 'transparent' : 'var(--border-default)'}`,
          padding: compact ? '2px 8px 2px 4px' : '3px 10px 3px 5px',
          fontSize: '11px',
        }}
        onMouseEnter={(e) => { if (!selected.length) e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
        onMouseLeave={(e) => { if (!selected.length) e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
        {selected.length > 0 ? (
          <>
            <AvatarGroup people={selected} max={3} size="xs" />
            {selected.length > 3 && (
              <span style={{ color: 'var(--text-tertiary)' }}>+{selected.length - 3}</span>
            )}
          </>
        ) : (
          <>
            <UserPlus size={11} /> Assign
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-60 max-h-72 overflow-hidden rounded-xl shadow-2xl flex flex-col"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <div className="p-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search…"
              className="w-full px-2 py-1.5 rounded-md bg-transparent text-[11.5px] outline-none placeholder:text-[var(--text-disabled)]"
              style={{ color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>No matches</p>
            ) : filtered.map((emp) => {
              const checked = value.includes(emp.id);
              return (
                <button key={emp.id} type="button" onClick={() => toggle(emp.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <Avatar name={emp.fullName} size="xs" />
                  <span className="truncate flex-1">{emp.fullName}</span>
                  {checked && (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--success)' }}>
                      <Check size={9} strokeWidth={3} style={{ color: '#0D0D0D' }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubtasksTab({ task, taskId }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [newAssignees, setNewAssignees] = useState([]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-light'],
    queryFn: getEmployees,
    staleTime: 60_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['task', taskId] });

  const addMut = useMutation({
    mutationFn: () => addSubtask(taskId, { title: title.trim(), assigneeIds: newAssignees }),
    onSuccess: () => { setTitle(''); setNewAssignees([]); refresh(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to add subtask'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isDone }) => updateSubtask(taskId, id, { isDone }),
    onMutate: async ({ id, isDone }) => {
      await qc.cancelQueries({ queryKey: ['task', taskId] });
      const prev = qc.getQueryData(['task', taskId]);
      qc.setQueryData(['task', taskId], (old) => old ? {
        ...old,
        subtasks: old.subtasks.map((s) => s.id === id ? { ...s, isDone } : s),
      } : old);
      return { prev };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(['task', taskId], ctx.prev); toast.error('Failed to toggle'); },
    onSettled: () => refresh(),
  });

  const assigneesMut = useMutation({
    mutationFn: ({ id, assigneeIds }) => updateSubtask(taskId, id, { assigneeIds }),
    onSuccess: () => refresh(),
    onError: () => toast.error('Failed to update assignees'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteSubtask(taskId, id),
    onSuccess: () => { toast.success('Subtask deleted'); refresh(); },
    onError: () => toast.error('Failed to delete'),
  });

  const subtasks = task?.subtasks || [];
  const doneCount = subtasks.filter((s) => s.isDone).length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const submitOnEnter = (e) => {
    if (e.key === 'Enter' && title.trim() && !addMut.isPending) {
      e.preventDefault();
      addMut.mutate();
    }
  };

  const allDone = total > 0 && doneCount === total;

  return (
    <div className="space-y-4">
      {/* Header / progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[11.5px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}>Checklist</span>
          </div>
          <span className="text-[11.5px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {total === 0
              ? 'Nothing yet'
              : allDone
                ? <span style={{ color: 'var(--success)' }}>All {total} done</span>
                : <><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{doneCount}</span> of {total} completed</>}
          </span>
        </div>
        <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: allDone ? 'var(--success)' : 'linear-gradient(90deg, var(--info), var(--success))',
            }} />
        </div>
      </div>

      {/* Add row */}
      <div className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl transition-colors focus-within:border-[var(--border-default)]"
        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
        <Plus size={14} style={{ color: 'var(--text-tertiary)' }} />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="Add a subtask…"
          className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-disabled)] py-1"
          style={{ color: 'var(--text-primary)' }}
        />
        <AssigneePicker value={newAssignees} onChange={setNewAssignees} employees={employees} />
        <button type="button"
          disabled={!title.trim() || addMut.isPending}
          onClick={() => addMut.mutate()}
          className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
          Add
        </button>
      </div>

      {/* List */}
      {!subtasks.length ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl"
          style={{ border: '1px dashed var(--border-subtle)' }}>
          <CheckSquare size={28} style={{ color: 'var(--text-disabled)' }} />
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            Break this task into smaller steps to track progress.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
          {subtasks.map((st, idx) => (
            <div key={st.id}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors"
              style={{
                borderBottom: idx < subtasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                opacity: st.isDone ? 0.65 : 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <button type="button"
                onClick={() => toggleMut.mutate({ id: st.id, isDone: !st.isDone })}
                className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: st.isDone ? 'var(--success)' : 'transparent',
                  border: `1.5px solid ${st.isDone ? 'var(--success)' : 'var(--border-default)'}`,
                }}
                onMouseEnter={(e) => { if (!st.isDone) e.currentTarget.style.borderColor = 'var(--success)'; }}
                onMouseLeave={(e) => { if (!st.isDone) e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                {st.isDone && <Check size={11} strokeWidth={3} style={{ color: '#0D0D0D' }} />}
              </button>
              <span className="flex-1 text-[12.5px] leading-snug"
                style={{
                  color: st.isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: st.isDone ? 'line-through' : 'none',
                }}>
                {st.title}
              </span>
              <AssigneePicker
                compact
                value={st.assignees?.map((a) => a.employee.id) || []}
                onChange={(ids) => assigneesMut.mutate({ id: st.id, assigneeIds: ids })}
                employees={employees}
              />
              <button type="button"
                onClick={() => { if (confirm('Delete this subtask?')) deleteMut.mutate(st.id); }}
                className="p-1.5 rounded-md transition-opacity opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger)/10'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskDetailDrawer({ taskId, onClose }) {
  const open = !!taskId;
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => getTaskComments(taskId),
    enabled: !!taskId && tab === 'Comments',
  });

  const { data: employeesList = [] } = useQuery({
    queryKey: ['employees-light'],
    queryFn: getEmployees,
    staleTime: 60_000,
    enabled: !!taskId,
  });

  const { mutate: doComplete, isPending: completing } = useMutation({
    mutationFn: () => completeTask(taskId),
    onSuccess: () => {
      toast.success('Task marked done');
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const { mutate: submitComment, isPending: submitting } = useMutation({
    mutationFn: () => addTaskComment(taskId, comment),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });

  const handleClose = () => { setTab('Overview'); setComment(''); onClose(); };

  const accentColor = task?.status?.color || PRIORITY_COLORS[task?.priority] || '#555';

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col transition-transform duration-[250ms] ease-out"
        style={{
          width: '520px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-24px 0 64px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {isLoading || !task ? (
          <div className="flex-1 flex items-center justify-center gap-2">
            {isLoading && <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</span>}
          </div>
        ) : (
          <>
            {/* Accent strip */}
            <div className="flex-shrink-0 h-0.5 w-full" style={{ background: accentColor, opacity: 0.7 }} />

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>

              {/* Top row: close + action */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {task.project && (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md"
                      style={{ background: `${task.project.color}20`, color: task.project.color, border: `1px solid ${task.project.color}35` }}>
                      <FolderKanban size={10} />
                      {task.project.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!task.status?.isDone && (
                    <button
                      onClick={() => doComplete()} disabled={completing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.color = '#4ADE80'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <CheckCircle size={13} />
                      {completing ? 'Saving…' : 'Mark Done'}
                    </button>
                  )}
                  {task.status?.isDone && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium"
                      style={{ background: '#4ADE8015', color: '#4ADE80', border: '1px solid #4ADE8030' }}>
                      <CheckCircle size={12} /> Completed
                    </span>
                  )}
                  <button onClick={handleClose}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[17px] font-bold leading-snug mb-2.5"
                style={{ color: 'var(--text-primary)' }}>{task.title}</h2>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
                {task.status && <Badge color={task.status.color}>{task.status.name}</Badge>}
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Tabs */}
              <div className="flex gap-0.5 -mb-px">
                {TABS.map(({ id, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium border-b-2 transition-all rounded-t-lg"
                    style={tab === id
                      ? { color: 'var(--text-primary)', borderBottomColor: accentColor, background: `${accentColor}10` }
                      : { color: 'var(--text-tertiary)', borderBottomColor: 'transparent' }
                    }>
                    <Icon size={11} />
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {tab === 'Overview' && (
                <div className="space-y-4">
                  {/* Description */}
                  {task.description && (
                    <div className="rounded-xl p-4"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--text-tertiary)' }}>Description</p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap"
                        style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                    </div>
                  )}

                  {/* People */}
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--text-tertiary)' }}>People</p>
                    <div className="grid grid-cols-2 gap-2">
                      <AssigneesCard assignees={task.assignees} />
                      <PersonCard icon={User} label="Creator" name={task.creator?.fullName} />
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--text-tertiary)' }}>Schedule</p>
                    <div className="grid grid-cols-2 gap-2">
                      <MetaCard icon={Calendar} label="Due Date">
                        {task.dueDate && (
                          <span style={{
                            color: !task.status?.isDone && new Date(task.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-primary)'
                          }}>
                            {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </MetaCard>
                      <MetaCard icon={Calendar} label="Created">
                        {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </MetaCard>
                      <MetaCard icon={Clock} label="Est. Hours">
                        {task.estimatedHours && `${task.estimatedHours}h`}
                      </MetaCard>
                      <MetaCard icon={Clock} label="Actual Hours">
                        {task.actualHours && `${task.actualHours}h`}
                      </MetaCard>
                    </div>
                  </div>

                  {/* Extra */}
                  {(task.lead || task.completedAt) && (
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--text-tertiary)' }}>Extra</p>
                      <div className="grid grid-cols-2 gap-2">
                        {task.lead && (
                          <MetaCard icon={Link2} label="Lead">{task.lead.contactName}</MetaCard>
                        )}
                        {task.completedAt && (
                          <MetaCard icon={CheckCircle} label="Completed At">
                            {new Date(task.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </MetaCard>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'Comments' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex-1 space-y-3">
                    {!comments?.length && (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <MessageSquare size={28} style={{ color: 'var(--text-disabled)' }} />
                        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No comments yet</p>
                      </div>
                    )}
                    {comments?.map(c => (
                      <div key={c.id} className="flex items-start gap-3">
                        <Avatar name={c.author.fullName} size="sm" />
                        <div className="flex-1 rounded-xl px-3.5 py-3"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
                          <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {c.author.fullName}
                          </p>
                          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: 'var(--text-secondary)' }}>
                            <CommentBody text={c.body} employees={employeesList} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <MentionTextarea
                      value={comment}
                      onChange={setComment}
                      employees={employeesList}
                      onSubmit={() => comment.trim() && !submitting && submitComment()}
                      placeholder="Write a comment… (use @ to mention)"
                      rows={3}
                      className="flex-1 rounded-xl px-3.5 py-2.5 text-[12.5px] focus:outline-none resize-none"
                      style={{
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={() => submitComment()}
                      disabled={!comment.trim() || submitting}
                      className="self-end p-2.5 rounded-xl transition-all"
                      style={{
                        background: comment.trim() ? 'var(--text-primary)' : 'var(--bg-surface-2)',
                        color: comment.trim() ? 'var(--accent-fg)' : 'var(--text-disabled)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}

              {tab === 'Subtasks' && <SubtasksTab task={task} taskId={taskId} />}

            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
