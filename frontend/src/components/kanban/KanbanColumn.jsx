import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanColumn({ column, items, type = 'lead', isDragging = false, onAddClick, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}` });

  return (
    <div className="flex-shrink-0 w-64 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: column.color }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{column.name}</span>
          <span className="text-[10.5px] px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
            {items.length}
          </span>
        </div>
        {onAddClick && (
          <button onClick={() => onAddClick(column.id)} style={{ color: 'var(--text-disabled)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
            <Plus size={13} />
          </button>
        )}
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-1.5 flex-1 min-h-[200px] p-1.5 rounded-xl transition-colors"
        style={{
          background: isOver ? `${column.color}14` : isDragging ? 'var(--bg-surface)' : 'transparent',
          border: isOver
            ? `1.5px dashed ${column.color}`
            : isDragging
              ? '1.5px dashed var(--border-subtle)'
              : '1.5px dashed transparent',
        }}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => <KanbanCard key={item.id} item={item} type={type} onCardClick={onCardClick} />)}
        </SortableContext>
        {items.length === 0 && !isDragging && (
          <div className="flex items-center justify-center h-14 rounded-lg" style={{ border: '1px dashed var(--border-subtle)' }}>
            <p className="text-[10.5px]" style={{ color: 'var(--text-disabled)' }}>Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
