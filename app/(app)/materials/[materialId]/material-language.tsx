"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { toast } from "sonner";

import { setMaterialLanguageAction } from "../actions";

/** Study-language selector on the material page. Visible to staff; students never
 *  reach this page. Editors can change it, others see it read-only. */
export function MaterialLanguage({
  materialId,
  language,
  languages,
  canEdit,
}: {
  materialId: string;
  language: string | null;
  languages: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(language ?? "");
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    const result = await setMaterialLanguageAction(materialId, next || null);
    setSaving(false);
    if (result.success) {
      toast.success("Язык изучения сохранён");
      router.refresh();
    } else {
      setValue(language ?? "");
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Languages className="h-4 w-4 text-muted-foreground" />
        Язык изучения
      </label>
      {canEdit ? (
        <select
          value={value}
          onChange={(e) => change(e.target.value)}
          disabled={saving}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Не выбран</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
          {/* Keep a previously-set value even if it was removed from Settings. */}
          {value && !languages.includes(value) ? <option value={value}>{value}</option> : null}
        </select>
      ) : (
        <span className="text-sm text-muted-foreground">{value || "Не выбран"}</span>
      )}
      {canEdit && languages.length === 0 ? (
        <span className="text-xs text-muted-foreground">Добавьте языки в настройках.</span>
      ) : null}
    </div>
  );
}
