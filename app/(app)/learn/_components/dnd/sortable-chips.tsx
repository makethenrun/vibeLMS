"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { FormattedText } from "@/components/shared/formatted-text";
import { cn } from "@/lib/utils";

export interface Chip {
  id: string;
  label: string;
  node?: import("react").ReactNode;
}

function SortableChip({ chip, disabled, className }: { chip: Chip; disabled: boolean; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chip.id, disabled });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab select-none rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm",
        isDragging && "opacity-60",
        disabled && "cursor-default",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      {chip.node ?? <FormattedText text={chip.label} />}
    </span>
  );
}

interface SortableChipsProps {
  chips: Chip[];
  onReorder: (chips: Chip[]) => void;
  disabled?: boolean;
  vertical?: boolean;
  chipClass?: (chip: Chip, index: number) => string;
}

export function SortableChips({ chips, onReorder, disabled = false, vertical = false, chipClass }: SortableChipsProps) {
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
      <SortableContext
        items={chips.map((c) => c.id)}
        strategy={vertical ? verticalListSortingStrategy : rectSortingStrategy}
      >
        <div className={vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
          {chips.map((chip, i) => (
            <SortableChip key={chip.id} chip={chip} disabled={disabled} className={cn(vertical && "py-2.5", chipClass?.(chip, i))} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
