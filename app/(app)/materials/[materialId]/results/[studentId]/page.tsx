import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { GRADABLE_TYPES, getMaterialItemsFlat } from "@/services/materials/results.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import { Workspace } from "../../../_components/workspace";
import { Breadcrumbs } from "../../../_components/breadcrumbs";
import { StudentSectionTree } from "@/app/(app)/learn/_components/student-section-tree";

export const metadata: Metadata = { title: "Результаты ученика" };

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ materialId: string; studentId: string }>;
}) {
  await requireTutor();
  const { materialId, studentId } = await params;

  const db = createServerSupabaseClient();
  const material = await getMaterial(db, materialId);
  if (!material) notFound();
  const { data: student } = await db.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

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

  const base = `/materials/${materialId}/results/${studentId}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Материалы", href: "/materials" },
          { label: material.title, href: `/materials/${material.id}` },
          { label: "Результаты", href: `/materials/${material.id}/results` },
          { label: student.full_name, href: base },
        ]}
      />
      <PageHeader title={student.full_name} description={`Материал «${material.title}» — прогресс и ответы.`} />

      <Workspace tree={<StudentSectionTree sections={sections} base={base} />} treeTitle="Разделы и уроки">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Прогресс ученика</CardTitle>
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
              <p className="text-sm text-muted-foreground">Откройте урок в списке справа, чтобы увидеть ответы.</p>
            )}
          </CardContent>
        </Card>
      </Workspace>
    </div>
  );
}
