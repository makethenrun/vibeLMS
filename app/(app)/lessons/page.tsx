import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentStudent } from "@/lib/auth/current-user";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getWeekEnd, getWeekStart, parseDateParam, shiftWeek, toDateParam } from "@/lib/utils/date";
import { getStudentGroupIds, listGroups } from "@/services/groups/groups.service";
import { listLessonsBetween } from "@/services/lessons/lessons.service";
import { assistantGroupIds, assistantMaterialAccess } from "@/services/assistants/assistants.service";
import { listMaterials } from "@/services/materials/materials.service";
import { listSessionHistory, type SessionHistoryRow } from "@/services/materials/live-session.service";
import type { LessonWithGroup } from "@/types";
import { LessonDialog } from "./lesson-dialog";
import { SessionHistory } from "./session-history";
import { StartSessionDialog } from "./start-session-dialog";
import { WeekCalendar } from "./week-calendar";

export const metadata: Metadata = { title: "Занятия" };

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const { date } = await searchParams;
  const base = parseDateParam(date);
  const weekStart = getWeekStart(base);
  const weekEnd = getWeekEnd(base);

  const db = createServerSupabaseClient();
  const isTutor = user.role === "TUTOR";

  let groups: { id: string; name: string }[] = [];
  let lessons: LessonWithGroup[] = [];

  const range = { from: weekStart.toISOString(), to: weekEnd.toISOString() };

  let history: SessionHistoryRow[] = [];

  if (isTutor) {
    const groupList = await listGroups(db);
    groups = groupList.map((group) => ({ id: group.id, name: group.name }));
    lessons = await listLessonsBetween(db, range);
    history = await listSessionHistory(db, { role: "TUTOR", userId: user.id });
  } else if (user.role === "ASSISTANT") {
    const groupIds = await assistantGroupIds(db, user.id);
    lessons = groupIds.length ? await listLessonsBetween(db, { ...range, groupIds }) : [];
    history = await listSessionHistory(db, { role: "ASSISTANT", userId: user.id });
  } else {
    const student = await getCurrentStudent();
    const groupIds = student ? await getStudentGroupIds(db, student.studentId) : [];
    lessons = await listLessonsBetween(db, { ...range, groupIds });
    history = await listSessionHistory(db, { role: "STUDENT", userId: user.id, studentId: student?.studentId, groupIds });
  }

  // Groups + materials the current staff member may run a live session with.
  const isStaff = user.role === "TUTOR" || user.role === "ASSISTANT";
  let sessionGroups: { id: string; name: string }[] = [];
  let sessionMaterials: { id: string; title: string }[] = [];
  if (isStaff) {
    const [allGroups, allMaterials] = await Promise.all([listGroups(db), listMaterials(db)]);
    if (isTutor) {
      sessionGroups = allGroups.map((g) => ({ id: g.id, name: g.name }));
      sessionMaterials = allMaterials.map((m) => ({ id: m.id, title: m.title }));
    } else {
      const gset = new Set(await assistantGroupIds(db, user.id));
      const mAccess = await assistantMaterialAccess(db, user.id);
      sessionGroups = allGroups.filter((g) => gset.has(g.id)).map((g) => ({ id: g.id, name: g.name }));
      sessionMaterials = allMaterials.filter((m) => mAccess.has(m.id)).map((m) => ({ id: m.id, title: m.title }));
    }
  }

  const prevWeek = toDateParam(shiftWeek(weekStart, -1));
  const nextWeek = toDateParam(shiftWeek(weekStart, 1));
  const rangeLabel = `${format(weekStart, "d MMM", { locale: ru })} — ${format(weekEnd, "d MMM yyyy", { locale: ru })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Занятия"
        description={rangeLabel}
        actions={
          isStaff ? (
            <>
              <StartSessionDialog groups={sessionGroups} materials={sessionMaterials} />
              {isTutor ? (
                <LessonDialog
                  mode="create"
                  groups={groups}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4" />
                      Создать занятие
                    </Button>
                  }
                />
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={`/lessons?date=${prevWeek}`} aria-label="Предыдущая неделя">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/lessons">Текущая неделя</Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={`/lessons?date=${nextWeek}`} aria-label="Следующая неделя">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <WeekCalendar
        weekStartISO={weekStart.toISOString()}
        lessons={lessons}
        isTutor={isTutor}
        groups={groups}
      />

      <SessionHistory rows={history} role={user.role} />
    </div>
  );
}
