"use client";

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

const BANK = "__bank__";

function Item({ id, label, disabled }: { id: string; label: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });
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
      {label}
    </span>
  );
}

function Bin({ id, title, items, disabled }: { id: string; title: string; items: string[]; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div ref={setNodeRef} className={cn("min-h-24 flex-1 space-y-2 rounded-md border p-2", isOver && "border-primary bg-accent")}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((label) => (
          <Item key={label} id={label} label={label} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

interface ColumnsBoardProps {
  columns: { title: string }[];
  items: string[];
  /** item → column index, or absent for the bank. */
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  disabled?: boolean;
}

export function ColumnsBoard({ columns, items, value, onChange, disabled = false }: ColumnsBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const bankItems = items.filter((it) => value[it] === undefined);

  function handleDragEnd(event: DragEndEvent) {
    const item = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over) return;
    const next = { ...value };
    if (over === BANK) delete next[item];
    else next[item] = Number(over.replace("col", ""));
    onChange(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          {columns.map((col, ci) => (
            <Bin
              key={ci}
              id={`col${ci}`}
              title={col.title}
              items={items.filter((it) => value[it] === ci)}
              disabled={disabled}
            />
          ))}
        </div>
        <BankBin items={bankItems} disabled={disabled} />
      </div>
    </DndContext>
  );
}

function BankBin({ items, disabled }: { items: string[]; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: BANK, disabled });
  return (
    <div ref={setNodeRef} className={cn("flex min-h-12 flex-wrap gap-2 rounded-md border border-dashed p-2", isOver && "border-primary bg-accent")}>
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground">Перетащите элементы в колонки</span>
      ) : (
        items.map((label) => <Item key={label} id={label} label={label} disabled={disabled} />)
      )}
    </div>
  );
}
