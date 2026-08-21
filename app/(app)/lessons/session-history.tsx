import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Radio } from "lucide-react";

import type { SessionHistoryRow } from "@/services/materials/live-session.service";
import type { UserRole } from "@/lib/db/database.types";

export function SessionHistory({ rows, role }: { rows: SessionHistoryRow[]; role: UserRole }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Radio className="h-4 w-4 text-red-500" />
        История живых занятий
      </h2>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Проведённых занятий пока нет.</p>
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
                {role === "STUDENT" ? <th className="px-3 py-2 font-medium">Присутствие</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{r.groupName}</td>
                  {role === "TUTOR" ? <td className="px-3 py-2">{r.hostLogin ?? "—"}</td> : null}
                  <td className="px-3 py-2">{format(new Date(r.startedAt), "d MMM yyyy", { locale: ru })}</td>
                  <td className="px-3 py-2">{format(new Date(r.startedAt), "HH:mm")}</td>
                  <td className="px-3 py-2">{format(new Date(r.endedAt), "HH:mm")}</td>
                  {role === "STUDENT" ? (
                    <td className="px-3 py-2">
                      {r.attended ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Был</span>
                      ) : (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Не был</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
