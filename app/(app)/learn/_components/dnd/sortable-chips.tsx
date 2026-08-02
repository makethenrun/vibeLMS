"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

export interface Chip {
  id: string;
  label: string;
}

function SortableChip({ chip, disabled }: { chip: Chip; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chip.id, disabled });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab select-none rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm",
        isDragging && "opacity-60",
        disabled && "cursor-default",
      )}
      {...attributes}
      {...listeners}
    >
      {chip.label}
    </span>
  );
}

interface SortableChipsProps {
  chips: Chip[];
  onReorder: (chips: Chip[]) => void;
  disabled?: boolean;
}

export function SortableChips({ chips, onReorder, disabled = false }: SortableChipsProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = chips.findIndex((c) => c.id === active.id);
    const newIndex = chips.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(chips, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chips.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <SortableChip key={chip.id} chip={chip} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
