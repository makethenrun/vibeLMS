"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import type { Chip } from "./sortable-chips";

const BANK = "__bank__";

function DraggableChip({ chip, disabled }: { chip: Chip; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: chip.id, disabled });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab select-none rounded-md border bg-background px-3 py-1 text-sm shadow-sm",
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

function Slot({ id, node, chip, disabled }: { id: string; node: ReactNode; chip: Chip | null; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div className="flex items-center gap-3 rounded-md border p-2">
      <div className="min-w-0 flex-1">{node}</div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-9 min-w-28 items-center justify-center rounded-md border border-dashed px-2",
          isOver && "border-primary bg-accent",
        )}
      >
        {chip ? <DraggableChip chip={chip} disabled={disabled} /> : <span className="text-xs text-muted-foreground">сюда</span>}
      </div>
    </div>
  );
}

interface AssignBoardProps {
  chips: Chip[];
  slots: { id: string; node: ReactNode }[];
  value: Record<string, string>; // slotId → chipId
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
}

export function AssignBoard({ chips, slots, value, onChange, disabled = false }: AssignBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const chipById = new Map(chips.map((c) => [c.id, c]));
  const assignedIds = new Set(Object.values(value));
  const bankChips = chips.filter((c) => !assignedIds.has(c.id));
  const { setNodeRef: setBankRef, isOver: bankOver } = useDroppable({ id: BANK, disabled });

  function handleDragEnd(event: DragEndEvent) {
    const chipId = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over) return;
    const next = { ...value };
    for (const slotId of Object.keys(next)) if (next[slotId] === chipId) delete next[slotId];
    if (over !== BANK) next[over] = chipId;
    onChange(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        <div className="space-y-2">
          {slots.map((slot) => (
            <Slot
              key={slot.id}
              id={slot.id}
              node={slot.node}
              chip={value[slot.id] ? chipById.get(value[slot.id]) ?? null : null}
              disabled={disabled}
            />
          ))}
        </div>
        <div
          ref={setBankRef}
          className={cn(
            "flex min-h-12 flex-wrap gap-2 rounded-md border border-dashed p-2",
            bankOver && "border-primary bg-accent",
          )}
        >
          {bankChips.length === 0 ? (
            <span className="text-xs text-muted-foreground">Перетащите слова в поля выше</span>
          ) : (
            bankChips.map((chip) => <DraggableChip key={chip.id} chip={chip} disabled={disabled} />)
          )}
        </div>
      </div>
    </DndContext>
  );
}
