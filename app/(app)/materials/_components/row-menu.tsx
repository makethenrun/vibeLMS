"use client";

import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowMenuProps {
  busy?: boolean;
  canUp: boolean;
  canDown: boolean;
  deleteLabel: string;
  onUp: () => void;
  onDown: () => void;
  /** Omit to hide the "Переименовать" action (e.g. for items without a title). */
  onRename?: () => void;
  onDelete: () => void;
}

export function RowMenu({
  busy = false,
  canUp,
  canDown,
  deleteLabel,
  onUp,
  onDown,
  onRename,
  onDelete,
}: RowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={busy} aria-label="Действия">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canUp} onSelect={onUp}>
          <ArrowUp className="h-4 w-4" />
          Вверх
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canDown} onSelect={onDown}>
          <ArrowDown className="h-4 w-4" />
          Вниз
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onRename ? (
          <DropdownMenuItem onSelect={onRename}>
            <Pencil className="h-4 w-4" />
            Переименовать
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="h-4 w-4" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
