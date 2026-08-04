"use client";

import { createContext, useContext, type ReactNode } from "react";
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

export const BANK_ID = "__bank__";

const norm = (s: string) => s.trim().toLowerCase();

/** Greedily assign chips to slots by matching labels (for restoring answers). */
export function assignByLabel(slots: { slotId: string; label: string }[], chips: Chip[]): Record<string, string> {
  const used = new Set<string>();
  const value: Record<string, string> = {};
  for (const { slotId, label } of slots) {
    if (!label) continue;
    const chip = chips.find((c) => !used.has(c.id) && norm(c.label) === norm(label));
    if (chip) {
      value[slotId] = chip.id;
      used.add(chip.id);
    }
  }
  return value;
}

interface FillCtx {
  value: Record<string, string>; // slotId → chipId
  chipById: Map<string, Chip>;
  disabled: boolean;
}
const Ctx = createContext<FillCtx>({ value: {}, chipById: new Map(), disabled: false });

export function DragChip({ chip, disabled, className }: { chip: Chip; disabled: boolean; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: chip.id, disabled });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }}
      className={cn(
        "inline-flex cursor-grab select-none items-center justify-center rounded-full border bg-primary/10 px-4 py-1.5 text-sm font-medium shadow-sm",
        isDragging && "opacity-70",
        disabled && "cursor-default",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      {chip.node ?? chip.label}
    </span>
  );
}

/** A droppable target. Renders `children`, and the assigned chip (if any). */
export function DropSlot({
  id,
  className,
  placeholder,
  children,
}: {
  id: string;
  className?: string;
  placeholder?: ReactNode;
  children?: ReactNode;
}) {
  const { value, chipById, disabled } = useContext(Ctx);
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  const chipId = value[id];
  const chip = chipId ? chipById.get(chipId) ?? null : null;
  return (
    <span ref={setNodeRef} className={cn("relative", isOver && "ring-2 ring-primary ring-offset-1", className)}>
      {children}
      {chip ? <DragChip chip={chip} disabled={disabled} /> : placeholder ?? null}
    </span>
  );
}

export function Bank({ className, chipClassName }: { className?: string; chipClassName?: string }) {
  const { value, chipById, disabled } = useContext(Ctx);
  const { setNodeRef, isOver } = useDroppable({ id: BANK_ID, disabled });
  const assigned = new Set(Object.values(value));
  const bankChips = [...chipById.values()].filter((c) => !assigned.has(c.id));
  return (
    <div
      ref={setNodeRef}
      className={cn("flex min-h-14 flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed p-3", isOver && "border-primary bg-accent", className)}
    >
      {bankChips.length === 0 ? (
        <span className="text-xs text-muted-foreground">Всё расставлено</span>
      ) : (
        bankChips.map((chip) => <DragChip key={chip.id} chip={chip} disabled={disabled} className={chipClassName} />)
      )}
    </div>
  );
}

export function FillDnd({
  chips,
  value,
  onChange,
  disabled = false,
  children,
}: {
  chips: Chip[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const chipById = new Map(chips.map((c) => [c.id, c]));

  function handleDragEnd(event: DragEndEvent) {
    const chipId = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over) return;
    const next = { ...value };
    for (const slotId of Object.keys(next)) if (next[slotId] === chipId) delete next[slotId];
    if (over !== BANK_ID) next[over] = chipId;
    onChange(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Ctx.Provider value={{ value, chipById, disabled }}>{children}</Ctx.Provider>
    </DndContext>
  );
}
