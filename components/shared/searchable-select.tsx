"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SearchableSelectItem {
  value: string;
  label: string;
}

/** A Radix Select with a filter box at the top of the dropdown. */
export function SearchableSelect({
  value,
  onValueChange,
  items,
  placeholder,
  searchPlaceholder = "Поиск…",
  emptyText = "Ничего не найдено",
  disabled,
  triggerClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: SearchableSelectItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 bg-popover p-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8"
              // Keep keystrokes/clicks from triggering Radix Select typeahead/close.
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">{emptyText}</div>
        ) : (
          filtered.map((i) => (
            <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
