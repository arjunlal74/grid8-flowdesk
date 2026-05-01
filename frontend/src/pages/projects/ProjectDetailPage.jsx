import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../api/projects.api.js';
import Badge, { PriorityBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import AvatarGroup from '../../components/ui/AvatarGroup.jsx';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });

  if (isLoading) return <div className="p-6 text-text-tertiary text-[13px]">Loading…</div>;
  if (!project) return <div className="p-6 text-danger text-[13px]">Project not found</div>;

  const doneTasks = project.tasks?.filter(t => t.status?.isDone).length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Projects</button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <div>
            <h1 className="text-[24px] font-semibold text-text-primary">{project.name}</h1>
            {project.code && <p className="text-[12px] text-text-tertiary mt-0.5">{project.code}</p>}
          </div>
        </div>
        <Badge color={{ PLANNING: '#60A5FA', ACTIVE: '#4ADE80', ON_HOLD: '#FBBF24', COMPLETED: '#A1A1A1', ARCHIVED: '#6B6B6B' }[project.status]}>
          {project.status.replace('_', ' ')}
        </Badge>
      </div>

      {project.description && <p className="text-[14px] text-text-secondary">{project.description}</p>}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          <div className="bg-bg-surface border rounded-card p-5">
            <h3 className="text-[14px] font-semibold text-text-primary mb-1">Tasks Progress</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[12px] text-text-tertiary">{progress}%</span>
            </div>
            <p className="text-[12px] text-text-tertiary">{doneTasks}/{totalTasks} tasks done</p>

            <div className="mt-4 space-y-2">
              {project.tasks?.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-bg-surface-2 rounded-lg">
                  <Badge color={task.status?.color}>{task.status?.name}</Badge>
                  <span className={`text-[13px] flex-1 ${task.status?.isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{task.title}</span>
                  <PriorityBadge priority={task.priority} />
                  {task.assignees?.length > 0 && (
                    <AvatarGroup people={task.assignees.map(a => a.employee)} max={3} size="xs" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="bg-bg-surface border rounded-card p-5 space-y-3 text-[13px]">
            <h3 className="text-[14px] font-semibold text-text-primary mb-3">Info</h3>
            {project.manager && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">Manager</span>
                <div className="flex items-center gap-2">
                  <Avatar name={project.manager.fullName} size="xs" />
                  <span className="text-text-primary">{project.manager.fullName}</span>
                </div>
              </div>
            )}
            {project.startDate && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">Start</span>
                <span className="text-text-primary">{new Date(project.startDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">End</span>
                <span className="text-text-primary">{new Date(project.endDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="bg-bg-surface border rounded-card p-5">
            <h3 className="text-[14px] font-semibold text-text-primary mb-3">Members ({project.members?.length || 0})</h3>
            <div className="space-y-2">
              {project.members?.map(m => (
                <div key={m.employeeId} className="flex items-center gap-2">
                  <Avatar name={m.employee.fullName} size="sm" />
                  <span className="text-[13px] text-text-primary">{m.employee.fullName}</span>
                  {m.role && <span className="text-[11px] text-text-tertiary ml-auto">{m.role}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
