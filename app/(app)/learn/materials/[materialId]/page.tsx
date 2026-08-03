import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { studentHasMaterialAccess } from "@/services/materials/student-access.service";
import { GRADABLE_TYPES, getMaterialItemsFlat } from "@/services/materials/results.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import { Workspace } from "@/app/(app)/materials/_components/workspace";
import { StudentSectionTree } from "../../_components/student-section-tree";

export const metadata: Metadata = { title: "Материал" };

export default async function StudentMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { studentId } = await requireStudent();
  const { materialId } = await params;

  const db = createServerSupabaseClient();
  if (!(await studentHasMaterialAccess(db, studentId, materialId))) notFound();

  const material = await getMaterial(db, materialId);
  if (!material) notFound();

  const [sections, flatAll] = await Promise.all([
    getSectionsWithLessons(db, materialId),
    getMaterialItemsFlat(db, materialId),
  ]);
  const gradable = flatAll.filter((f) => GRADABLE_TYPES.includes(f.item.type));
  const subs = await getSubmissionsForItems(db, studentId, gradable.map((f) => f.item.id));

  const answered = gradable.filter((f) => subs[f.item.id]).length;
  const scores = gradable.map((f) => subs[f.item.id]).filter((s) => s && s.score !== null).map((s) => Number(s!.score));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const overall = gradable.length ? Math.round((answered / gradable.length) * 100) : 0;

  const byLesson = new Map<string, { total: number; done: number }>();
  for (const f of gradable) {
    const e = byLesson.get(f.lessonTitle) ?? { total: 0, done: 0 };
    e.total += 1;
    if (subs[f.item.id]) e.done += 1;
    byLesson.set(f.lessonTitle, e);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={material.title} description={material.description ?? "Ваш прогресс и уроки материала."} />
      <Workspace tree={<StudentSectionTree sections={sections} base="/learn" />} treeTitle="Разделы и уроки">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Ваш прогресс</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-semibold">{overall}%</p>
                <p className="text-xs text-muted-foreground">пройдено ({answered} из {gradable.length})</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{avg === null ? "—" : `${avg}%`}</p>
                <p className="text-xs text-muted-foreground">средний балл</p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${overall}%` }} />
            </div>

            {byLesson.size > 0 ? (
              <ul className="space-y-1 text-sm">
                {[...byLesson.entries()].map(([lesson, e]) => (
                  <li key={lesson} className="flex items-center justify-between">
                    <span className="truncate">{lesson}</span>
                    <span className="text-muted-foreground">{e.done} / {e.total}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Упражнений пока нет. Откройте урок в списке справа.</p>
            )}
          </CardContent>
        </Card>
      </Workspace>
    </div>
  );
}
