import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTask, completeTask, getTaskComments, addTaskComment } from '../../api/tasks.api.js';
import Badge, { PriorityBadge } from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import {
  CheckCircle, Send, X, User, Calendar, Clock,
  FolderKanban, Link2, CheckSquare, MessageSquare, AlignLeft,
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
                          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Write a comment…"
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

              {tab === 'Subtasks' && (
                <div className="space-y-2">
                  {!task.subtasks?.length && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <CheckSquare size={28} style={{ color: 'var(--text-disabled)' }} />
                      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No subtasks</p>
                    </div>
                  )}
                  {task.subtasks?.map(st => (
                    <div key={st.id} className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: `${st.status?.color}25`, border: `1.5px solid ${st.status?.color}` }}>
                        {st.status?.isDone && <CheckCircle size={9} style={{ color: st.status.color }} />}
                      </div>
                      <span className="text-[12.5px] flex-1"
                        style={{
                          color: st.status?.isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          textDecoration: st.status?.isDone ? 'line-through' : 'none',
                        }}>
                        {st.title}
                      </span>
                      {st.status && <Badge color={st.status.color}>{st.status.name}</Badge>}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
