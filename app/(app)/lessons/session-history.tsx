"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Radio } from "lucide-react";

import type { SessionHistoryRow, SessionStatus } from "@/services/materials/live-session.service";
import type { UserRole } from "@/lib/db/database.types";
import { DeleteLessonButton } from "./delete-lesson-button";
import { DeleteSessionButton } from "./delete-session-button";

const STATUS: Record<SessionStatus, { label: string; cls: string }> = {
  conducted: { label: "Проведено", cls: "bg-green-100 text-green-700" },
  not_conducted: { label: "Не проведено", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Отменено", cls: "bg-red-100 text-red-700" },
  unplanned: { label: "Незапланированное", cls: "bg-sky-100 text-sky-700" },
  in_progress: { label: "Идёт", cls: "bg-red-100 text-red-700" },
};

export function SessionHistory({ rows, role }: { rows: SessionHistoryRow[]; role: UserRole }) {
  const showActions = role !== "STUDENT";

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Radio className="h-4 w-4 text-red-500" />
        История занятий
      </h2>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Занятий пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Группа</th>
                {role === "TUTOR" ? <th className="px-3 py-2 font-medium">Кто вёл</th> : null}
                <th className="px-3 py-2 font-medium">Дата</th>
                <th className="px-3 py-2 font-medium">Начало</th>
                <th className="px-3 py-2 font-medium">Конец</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                {role === "STUDENT" ? <th className="px-3 py-2 font-medium">Присутствие</th> : null}
                {showActions ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = STATUS[r.status];
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <span>{r.groupName}</span>
                      {r.title ? <span className="block text-xs text-muted-foreground">{r.title}</span> : null}
                    </td>
                    {role === "TUTOR" ? <td className="px-3 py-2">{r.hostLogin ?? "—"}</td> : null}
                    <td className="px-3 py-2">{format(new Date(r.startedAt), "d MMM yyyy", { locale: ru })}</td>
                    <td className="px-3 py-2">{format(new Date(r.startedAt), "HH:mm")}</td>
                    <td className="px-3 py-2">{r.endedAt ? format(new Date(r.endedAt), "HH:mm") : "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    {role === "STUDENT" ? (
                      <td className="px-3 py-2">
                        {r.status === "conducted" || r.status === "unplanned" ? (
                          r.attended ? (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Был</span>
                          ) : (
                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Не был</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    ) : null}
                    {showActions ? (
                      <td className="px-2 py-1 text-right">
                        {r.deleteSessionId ? (
                          <DeleteSessionButton sessionId={r.deleteSessionId} />
                        ) : r.deleteLessonId ? (
                          <DeleteLessonButton lessonId={r.deleteLessonId} />
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
