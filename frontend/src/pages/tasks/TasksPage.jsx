import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { getTasks, moveTask } from '../../api/tasks.api.js';
import KanbanBoard from '../../components/kanban/KanbanBoard.jsx';
import Badge, { PriorityBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import AvatarGroup from '../../components/ui/AvatarGroup.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Button from '../../components/ui/Button.jsx';
import NewTaskDrawer from '../../components/tasks/NewTaskDrawer.jsx';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [defaultStatusId, setDefaultStatusId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const qc = useQueryClient();

  const params = { view, page, limit: 25 };
  const { data, isLoading } = useQuery({ queryKey: ['tasks', params], queryFn: () => getTasks(params) });

  const { mutate: moveTaskMutation } = useMutation({
    mutationFn: ({ id, data }) => moveTask(id, data),
    onMutate: async ({ id, data: moveData }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshots = qc.getQueriesData({ queryKey: ['tasks'] });
      qc.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!Array.isArray(old)) return old;
        let moved = null;
        const stripped = old.map(col => {
          const items = col.tasks || [];
          const found = items.find(t => t.id === id);
          if (found) moved = found;
          return { ...col, tasks: items.filter(t => t.id !== id) };
        });
        if (!moved) return old;
        return stripped.map(col => {
          if (col.id !== moveData.statusId) return col;
          const { tasks: _t, leads: _l, ...statusObj } = col;
          const updated = { ...moved, statusId: moveData.statusId, status: statusObj };
          return { ...col, tasks: [...(col.tasks || []), updated] };
        });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Failed to move task');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const viewTabs = (
    <div className="flex items-center gap-5">
      {[{ v: 'list', label: 'List', I: List }, { v: 'kanban', label: 'Board', I: LayoutGrid }].map(({ v, label, I }) => (
        <button key={v} onClick={() => setView(v)}
          className="flex items-center gap-1.5 pb-1 relative transition-colors"
          style={{ 
            color: view === v ? 'var(--accent)' : 'var(--text-tertiary)',
            borderBottom: view === v ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: view === v ? 600 : 500,
            fontSize: '13px'
          }}>
          <I size={14} />
          {label}
        </button>
      ))}
    </div>
  );

  const headerActions = (
    <>
      <Button onClick={() => { setDefaultStatusId(null); setDrawerOpen(true); }} size="sm">
        <Plus size={12} /> New Task
      </Button>
    </>
  );

  const totalCount = view === 'list' 
    ? data?.total 
    : data?.reduce?.((sum, col) => sum + (col.tasks?.length || 0), 0);

  return (
    <PageLayout title="Tasks" count={totalCount} actions={headerActions} tabs={viewTabs}>

      {isLoading ? (
        <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={data || []}
          type="task"
          onMove={(id, d) => moveTaskMutation({ id, data: d })}
          onAddClick={(statusId) => { setDefaultStatusId(statusId); setDrawerOpen(true); }}
          onCardClick={(id) => setSelectedTaskId(id)}
        />
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Title', 'Project', 'Assignees', 'Status', 'Priority', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((task, i) => (
                <tr key={task.id}
                  style={{ borderBottom: i < (data.data.length - 1) ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedTaskId(task.id)}
                      className="text-[12.5px] font-medium hover:underline text-left"
                      style={{ color: 'var(--text-primary)' }}>
                      {task.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {task.project ? (
                      <span className="text-[11.5px] px-2 py-0.5 rounded-md"
                        style={{ background: `${task.project.color}18`, color: 'var(--text-secondary)', border: `1px solid ${task.project.color}30` }}>
                        {task.project.name}
                      </span>
                    ) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {task.assignees?.length ? (
                      <div className="flex items-center gap-2">
                        <AvatarGroup people={task.assignees.map(a => a.employee)} max={3} size="xs" />
                        {task.assignees.length === 1 && (
                          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                            {task.assignees[0].employee.fullName}
                          </span>
                        )}
                      </div>
                    ) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">{task.status && <Badge color={task.status.color}>{task.status.name}</Badge>}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                      title="View details"
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    No tasks yet. Create your first task →
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} total={data?.total || 0} limit={25} onChange={setPage} />
        </div>
      )}
      <NewTaskDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDefaultStatusId(null); }}
        defaultStatusId={defaultStatusId}
      />
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </PageLayout>
  );
}
