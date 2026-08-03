"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmilePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setReactionAction } from "../../actions";

const REACTIONS = ["👍", "🎉", "🔥", "💪", "👏", "⭐", "❤️", "🤔"];

export function ReactionPicker({
  studentId,
  itemId,
  materialId,
  current,
}: {
  studentId: string;
  itemId: string;
  materialId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(current);

  async function set(reaction: string | null) {
    setValue(reaction);
    const result = await setReactionAction(studentId, itemId, reaction, materialId);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          {value ? <span className="text-base">{value}</span> : <SmilePlus className="h-4 w-4" />}
          Реакция
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="grid grid-cols-4 gap-1 p-1">
          {REACTIONS.map((r) => (
            <button key={r} type="button" onClick={() => set(r)} className="rounded p-1.5 text-xl hover:bg-accent">
              {r}
            </button>
          ))}
        </div>
        {value ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => set(null)}>Убрать реакцию</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
