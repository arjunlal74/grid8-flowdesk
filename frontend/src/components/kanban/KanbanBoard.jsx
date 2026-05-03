import { DndContext, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanBoard({ columns, type = 'lead', onMove, onAddClick, onCardClick }) {
  const [activeItem, setActiveItem] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const collisionDetection = (args) => {
    const pointer = pointerWithin(args);
    return pointer.length > 0 ? pointer : rectIntersection(args);
  };

  const findColumn = (id) => columns.find(col => {
    const items = type === 'lead' ? col.leads : col.tasks;
    return items?.some(i => i.id === id);
  });

  const handleDragStart = ({ active }) => {
    for (const col of columns) {
      const items = type === 'lead' ? col.leads : col.tasks;
      const item = items?.find(i => i.id === active.id);
      if (item) { setActiveItem(item); break; }
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveItem(null);
    if (!over) return;

    const sourceCol = findColumn(active.id);
    // `over.id` is either a namespaced column id (`col-<id>`) when dropped on empty column
    // space, or a card id (when dropped on another card). Resolve to a column either way.
    const destCol = typeof over.id === 'string' && over.id.startsWith('col-')
      ? columns.find(c => String(c.id) === over.id.slice(4))
      : findColumn(over.id);
    if (!sourceCol || !destCol) return;
    if (sourceCol.id === destCol.id && active.id === over.id) return;

    const targetItems = type === 'lead' ? destCol.leads : destCol.tasks;
    const newPosition = targetItems?.length || 0;

    onMove?.(active.id, {
      statusId: destCol.id,
      position: newPosition,
    });
  };

  const isDragging = activeItem !== null;

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-stretch min-h-[calc(100vh-180px)]">
        {columns.map(col => {
          const items = type === 'lead' ? (col.leads || []) : (col.tasks || []);
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              items={items}
              type={type}
              isDragging={isDragging}
              onAddClick={onAddClick}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeItem && <KanbanCard item={activeItem} type={type} />}
      </DragOverlay>
    </DndContext>
  );
}
