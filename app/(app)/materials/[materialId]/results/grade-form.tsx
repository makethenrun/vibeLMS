"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gradeSubmissionAction } from "../../actions";

export function GradeForm({
  studentId,
  itemId,
  materialId,
  initialScore,
}: {
  studentId: string;
  itemId: string;
  materialId: string;
  initialScore: number | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore ?? 0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await gradeSubmissionAction(studentId, itemId, score, materialId);
      if (result.success) {
        toast.success("Оценка сохранена");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={100}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        className="h-8 w-20"
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button size="sm" disabled={saving} onClick={save}>Оценить</Button>
    </div>
  );
}
