"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { GroupWithCount } from "@/types";
import { setMaterialGroupsAction } from "../actions";

interface GroupsAccessProps {
  materialId: string;
  groups: GroupWithCount[];
  selectedIds: string[];
}

export function GroupsAccess({ materialId, groups, selectedIds }: GroupsAccessProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [busy, setBusy] = useState(false);

  async function toggle(groupId: string) {
    const next = selected.includes(groupId)
      ? selected.filter((g) => g !== groupId)
      : [...selected, groupId];
    setSelected(next);
    setBusy(true);
    try {
      const result = await setMaterialGroupsAction(materialId, next);
      if (result.success) router.refresh();
      else toast.error(result.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Доступ групп</label>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Групп пока нет.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <label
              key={g.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                onChange={() => toggle(g.id)}
                disabled={busy}
              />
              {g.name}
            </label>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Выбранным группам будет доступен материал; их же можно закрепить у упражнений.
      </p>
    </div>
  );
}
