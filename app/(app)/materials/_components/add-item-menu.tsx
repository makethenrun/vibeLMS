"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultContentFor } from "@/lib/validators";
import type { MaterialItemType } from "@/types";
import { createItemAction } from "../actions";

const TYPE_LABELS: { type: MaterialItemType; label: string }[] = [
  { type: "INFO", label: "Обучающая информация" },
  { type: "CHOICE", label: "Выбор ответа" },
  { type: "GAPS", label: "Заполнить пропуски" },
  { type: "FREE", label: "Свободный ответ" },
  { type: "MATCH", label: "Сопоставление пар" },
];

export function AddItemMenu({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function addItem(type: MaterialItemType) {
    setBusy(true);
    try {
      const result = await createItemAction(moduleId, defaultContentFor(type));
      if (result.success) {
        toast.success("Элемент добавлен");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={busy}>
          <Plus className="h-4 w-4" />
          Добавить элемент
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TYPE_LABELS.map(({ type, label }) => (
          <DropdownMenuItem key={type} onSelect={() => void addItem(type)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
