import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Calendar } from 'lucide-react';
import Badge, { PriorityBadge } from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import { Link } from 'react-router-dom';

export default function KanbanCard({ item, type = 'lead', onCardClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const href = `/${type}s/${item.id}`;
  const title = type === 'lead' ? item.contactName : item.title;
  const subtitle = type === 'lead' ? item.companyName : item.project?.name;

  return (
    <div ref={setNodeRef} style={{ ...style, background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px', cursor: 'grab' }}
      className="active:cursor-grabbing select-none transition-shadow hover:border-[var(--border-default)]"
      {...attributes} {...listeners}>

      <div className="flex items-start justify-between gap-1 mb-1.5">
        {onCardClick ? (
          <button className="text-[12.5px] font-medium hover:underline truncate text-left"
            style={{ color: 'var(--text-primary)' }}
            onClick={e => { e.stopPropagation(); onCardClick(item.id); }}
            onPointerDown={e => e.stopPropagation()}>
            {title}
          </button>
        ) : (
          <Link to={href} className="text-[12.5px] font-medium hover:underline truncate"
            style={{ color: 'var(--text-primary)' }}
            onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
            {title}
          </Link>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
      )}

      <div className="flex items-center gap-1 flex-wrap mb-2">
        {item.status && <Badge color={item.status.color}>{item.status.name}</Badge>}
        <PriorityBadge priority={item.priority} />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1.5">
          {(item.owner || item.assignee) && (
            <Avatar name={item.owner?.fullName || item.assignee?.fullName} size="xs" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {type === 'lead' && item.estimatedValue && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              ₹{Number(item.estimatedValue).toLocaleString('en-IN')}
            </span>
          )}
          {(item.expectedCloseAt || item.dueDate) && (
            <span className="flex items-center gap-1 text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>
              <Calendar size={10} />
              {new Date(item.expectedCloseAt || item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
