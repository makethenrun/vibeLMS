"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { GroupWithCount } from "@/types";
import { GroupCard } from "./group-card";

type Sort = "name" | "created";

export function GroupsBrowser({ groups, readOnly }: { groups: GroupWithCount[]; readOnly: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("name");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : groups;
    const sorted = [...filtered].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "ru")
        : b.created_at.localeCompare(a.created_at),
    );
    return sorted;
  }, [groups, query, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск групп" className="pl-8" />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="Сортировка"
        >
          <option value="name">По алфавиту</option>
          <option value="created">По дате добавления</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((group) => (
            <GroupCard key={group.id} group={group} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
}
