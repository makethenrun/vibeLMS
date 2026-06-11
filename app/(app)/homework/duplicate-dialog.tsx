"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { duplicateHomeworkAction } from "./actions";

interface LessonOption {
  id: string;
  label: string;
}

interface DuplicateHomeworkDialogProps {
  homeworkId: string;
  lessons: LessonOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateHomeworkDialog({
  homeworkId,
  lessons,
  open,
  onOpenChange,
}: DuplicateHomeworkDialogProps) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);

  async function handleDuplicate() {
    if (!target) {
      toast.error("Выберите занятие");
      return;
    }
    setPending(true);
    const result = await duplicateHomeworkAction(homeworkId, target);
    setPending(false);
    if (result.success) {
      toast.success("Задание скопировано");
      setTarget("");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Дублировать задание</DialogTitle>
          <DialogDescription>
            Создаст копию этого задания (с теми же вопросами) в выбранном занятии/группе.
          </DialogDescription>
        </DialogHeader>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите занятие" />
          </SelectTrigger>
          <SelectContent>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <LoadingButton loading={pending} onClick={handleDuplicate}>
            Дублировать
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
