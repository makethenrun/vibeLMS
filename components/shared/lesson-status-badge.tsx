import { Badge } from "@/components/ui/badge";
import { LESSON_STATUS_LABELS } from "@/lib/constants";
import type { LessonStatus } from "@/lib/db/database.types";

const STATUS_VARIANT: Record<LessonStatus, "default" | "success" | "destructive"> = {
  SCHEDULED: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{LESSON_STATUS_LABELS[status]}</Badge>;
}
