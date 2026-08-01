"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModuleWithItems } from "@/types";
import { createModuleAction } from "../actions";
import { ModuleEditor } from "./module-editor";

export function LessonEditor({ lessonId, modules }: { lessonId: string; modules: ModuleWithItems[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function addModule() {
    const title = draft.trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    setBusy(true);
    try {
      const result = await createModuleAction(lessonId, title);
      if (result.success) {
        toast.success("Модуль добавлен");
        setDraft("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          В уроке пока нет модулей. Добавьте первый модуль ниже.
        </p>
      ) : (
        modules.map((module, index) => (
          <ModuleEditor
            key={module.id}
            module={module}
            canUp={index > 0}
            canDown={index < modules.length - 1}
          />
        ))
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Новый модуль"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addModule();
          }}
        />
        <Button disabled={busy} onClick={addModule}>
          <Plus className="h-4 w-4" />
          Добавить модуль
        </Button>
      </div>
    </div>
  );
}
