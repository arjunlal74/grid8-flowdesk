import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanBoard({ columns, type = 'lead', onMove, onAddClick, onCardClick }) {
  const [activeItem, setActiveItem] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
    if (!over || active.id === over.id) return;

    const sourceCol = findColumn(active.id);
    const destColId = over.id;

    if (sourceCol) {
      const items = type === 'lead' ? sourceCol.leads : sourceCol.tasks;
      const destItems = columns.find(c => c.id === destColId);
      const targetItems = destItems ? (type === 'lead' ? destItems.leads : destItems.tasks) : items;
      const newPosition = targetItems?.length || 0;

      onMove?.(active.id, {
        statusId: destColId,
        position: newPosition,
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const items = type === 'lead' ? (col.leads || []) : (col.tasks || []);
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              items={items}
              type={type}
              onAddClick={onAddClick}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeItem && <KanbanCard item={activeItem} type={type} />}
      </DragOverlay>
    </DndContext>
  );
}
