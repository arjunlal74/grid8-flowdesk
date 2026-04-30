import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, CheckSquare, CalendarDays } from 'lucide-react';
import { getProjects } from '../../api/projects.api.js';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import NewProjectDrawer from '../../components/projects/NewProjectDrawer.jsx';
import ProjectDetailDrawer from '../../components/projects/ProjectDetailDrawer.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';

const STATUS_COLORS = {
  PLANNING: '#60A5FA',
  ACTIVE: '#4ADE80',
  ON_HOLD: '#FBBF24',
  COMPLETED: '#A1A1A1',
  ARCHIVED: '#6B6B6B',
};

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ProjectCard({ project, onClick }) {
  const taskCount = project._count?.tasks || 0;
  const color = project.color || '#6366F1';
  const memberCount = project.members?.length || 0;
  const monogramFg = luminance(color) > 0.4 ? 'rgba(0,0,0,0.75)' : '#fff';

  return (
    <div
      onClick={onClick}
      className="rounded-xl cursor-pointer flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        transition: 'box-shadow 180ms, border-color 180ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 0 1.5px ${color}88`;
        e.currentTarget.style.borderColor = `${color}66`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div className="flex flex-col flex-1" style={{ padding: '16px' }}>

        {/* Header row — monogram + name + status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Monogram badge */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: monogramFg,
            flexShrink: 0, letterSpacing: '-0.5px',
          }}>
            {initials(project.name)}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-semibold leading-snug truncate"
                  style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h3>
                {project.code && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{project.code}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <Badge color={STATUS_COLORS[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] line-clamp-2 mb-4"
          style={{ color: project.description ? 'var(--text-secondary)' : 'var(--text-tertiary)', lineHeight: '1.55', minHeight: '34px', fontStyle: project.description ? 'normal' : 'italic' }}>
          {project.description || 'No description'}
        </p>

        {/* Manager */}
        {project.manager && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar name={project.manager.fullName} src={project.manager.avatarUrl} size="xs" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Manager</p>
              <p className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{project.manager.fullName}</p>
            </div>
          </div>
        )}

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-1.5 mb-3">
            <CalendarDays size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <p className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
              {fmt(project.startDate)}
              {project.startDate && project.endDate && <span style={{ color: 'var(--text-tertiary)' }}> → </span>}
              {fmt(project.endDate)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'auto', paddingTop: '12px' }}>

          {/* Member avatar stack */}
          <div className="flex items-center">
            {project.members?.slice(0, 3).map((m, i) => (
              <div key={m.employeeId} style={{
                marginLeft: i === 0 ? 0 : '-7px',
                zIndex: 10 - i,
                position: 'relative',
                borderRadius: '50%',
                border: '2px solid var(--bg-surface)',
              }}>
                <Avatar name={m.employee.fullName} src={m.employee.avatarUrl} size="sm" />
              </div>
            ))}
            {memberCount > 3 && (
              <div style={{
                marginLeft: '-7px', zIndex: 7, position: 'relative',
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '2px solid var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)',
              }}>
                +{memberCount - 3}
              </div>
            )}
            <div style={{
              marginLeft: memberCount > 0 ? '6px' : 0,
              width: '22px', height: '22px', borderRadius: '50%',
              border: '1.5px dashed var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', flexShrink: 0,
            }}>
              <Plus size={10} strokeWidth={2} />
            </div>
          </div>

          {/* Task count */}
          <div className="flex items-center gap-1.5">
            <CheckSquare size={11} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  return (
    <PageLayout
      title="Projects"
      count={projects?.length}
      actions={<Button onClick={() => setNewDrawerOpen(true)} size="sm"><Plus size={12} /> New Project</Button>}
    >
      {isLoading ? (
        <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No projects yet.</p>
          <Button onClick={() => setNewDrawerOpen(true)} size="sm"><Plus size={12} /> Create first project</Button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProjectId(project.id)}
            />
          ))}
        </div>
      )}

      <NewProjectDrawer open={newDrawerOpen} onClose={() => setNewDrawerOpen(false)} />
      <ProjectDetailDrawer
        projectId={selectedProjectId}
        open={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </PageLayout>
  );
}
