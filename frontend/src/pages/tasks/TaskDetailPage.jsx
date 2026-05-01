import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTask, completeTask, getTaskComments, addTaskComment } from '../../api/tasks.api.js';
import Badge, { PriorityBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Comments', 'Subtasks'];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = useQuery({ queryKey: ['task', id], queryFn: () => getTask(id) });
  const { data: comments } = useQuery({ queryKey: ['task-comments', id], queryFn: () => getTaskComments(id), enabled: tab === 'Comments' });

  const { mutate: doComplete } = useMutation({
    mutationFn: () => completeTask(id),
    onSuccess: () => { toast.success('Task completed!'); qc.invalidateQueries({ queryKey: ['task', id] }); },
  });

  const { mutate: submitComment, isPending: submitting } = useMutation({
    mutationFn: () => addTaskComment(id, comment),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['task-comments', id] }); },
  });

  if (isLoading) return <div className="p-6 text-text-tertiary text-[13px]">Loading…</div>;
  if (!task) return <div className="p-6 text-danger text-[13px]">Task not found</div>;

  const isDone = task.status?.isDone;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/tasks')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Tasks</button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          <div className="bg-bg-surface border rounded-card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-[22px] font-semibold text-text-primary">{task.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {task.status && <Badge color={task.status.color}>{task.status.name}</Badge>}
                  <PriorityBadge priority={task.priority} />
                  {task.project && <Badge style={{ backgroundColor: `${task.project.color}20`, color: task.project.color }}>{task.project.name}</Badge>}
                </div>
              </div>
              {!isDone && (
                <Button variant="secondary" size="sm" onClick={() => doComplete()}>
                  <CheckCircle size={13} /> Mark Done
                </Button>
              )}
            </div>

            <div className="flex gap-1 border-b border mb-4">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    tab === t ? 'border-white text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Overview' && (
              <div className="space-y-3 text-[13px]">
                {task.description && <p className="text-text-secondary whitespace-pre-wrap">{task.description}</p>}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    ['Due Date', task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : null],
                    ['Est. Hours', task.estimatedHours],
                    ['Actual Hours', task.actualHours],
                    ['Completed', task.completedAt ? new Date(task.completedAt).toLocaleString() : null],
                  ].map(([k, v]) => v ? (
                    <div key={k}>
                      <p className="text-text-tertiary text-[11px] mb-0.5">{k}</p>
                      <p className="text-text-primary">{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {tab === 'Comments' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {comments?.map(c => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar name={c.author.fullName} size="sm" />
                      <div className="flex-1 bg-bg-surface-2 rounded-card p-3">
                        <p className="text-[12px] font-medium text-text-primary mb-1">{c.author.fullName}</p>
                        <p className="text-[13px] text-text-secondary">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                    className="flex-1 bg-bg-surface-2 border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-border-strong resize-none"
                  />
                  <Button onClick={() => submitComment()} disabled={!comment.trim() || submitting} variant="secondary" size="sm">
                    <Send size={13} />
                  </Button>
                </div>
              </div>
            )}

            {tab === 'Subtasks' && (
              <div className="space-y-2">
                {task.subtasks?.map(st => (
                  <div key={st.id} className="flex items-center gap-3 p-3 bg-bg-surface-2 rounded-lg">
                    <Badge color={st.status?.color}>{st.status?.name}</Badge>
                    <span className={`text-[13px] flex-1 ${st.status?.isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{st.title}</span>
                  </div>
                ))}
                {!task.subtasks?.length && <p className="text-[13px] text-text-tertiary">No subtasks</p>}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4">
          <div className="bg-bg-surface border rounded-card p-5 space-y-3 text-[13px]">
            <h3 className="text-[14px] font-semibold text-text-primary mb-3">Details</h3>
            {task.assignees?.length > 0 && (
              <div className="flex justify-between gap-2 items-start">
                <span className="text-text-tertiary">Assignees</span>
                <div className="flex flex-col items-end gap-1">
                  {task.assignees.map(a => (
                    <div key={a.employee.id} className="flex items-center gap-1.5">
                      <Avatar name={a.employee.fullName} size="xs" />
                      <span className="text-text-primary font-medium">{a.employee.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {[
              ['Creator', task.creator?.fullName],
              ['Lead', task.lead?.contactName],
              ['Created', new Date(task.createdAt).toLocaleDateString('en-IN')],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-text-tertiary">{k}</span>
                <span className="text-text-primary font-medium text-right">{v}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    </div>
  );
}
