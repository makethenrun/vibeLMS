import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import {
  GRADABLE_TYPES,
  getMaterialItemsFlat,
  getMaterialStudentGroups,
  listMaterialStudents,
} from "@/services/materials/results.service";
import { getSubmissionsByStudentItem } from "@/services/materials/submissions.service";
import type { FreeContent } from "@/lib/validators";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { GradeForm } from "./grade-form";

export const metadata: Metadata = { title: "Результаты" };

export default async function MaterialResultsPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  await requireTutor();
  const { materialId } = await params;

  const db = createServerSupabaseClient();
  const material = await getMaterial(db, materialId);
  if (!material) notFound();

  const [flat, students, studentGroups] = await Promise.all([
    getMaterialItemsFlat(db, materialId),
    listMaterialStudents(db, materialId),
    getMaterialStudentGroups(db, materialId),
  ]);
  const gradable = flat.filter((f) => GRADABLE_TYPES.includes(f.item.type));
  const subs = await getSubmissionsByStudentItem(db, gradable.map((f) => f.item.id));

  const rows = students.map((student) => {
    const mine = gradable
      .map((f) => subs[`${student.id}:${f.item.id}`])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const answered = mine.length;
    const scored = mine.filter((s) => s.score !== null).map((s) => Number(s.score));
    const avg = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
    return { student, answered, avg };
  });

  const pending = flat
    .filter((f) => f.item.type === "FREE")
    .flatMap((f) =>
      students.map((student) => ({ f, student, sub: subs[`${student.id}:${f.item.id}`] }))
        .filter((x) => x.sub && x.sub.score === null),
    );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Материалы", href: "/materials" },
          { label: material.title, href: `/materials/${material.id}` },
          { label: "Результаты", href: `/materials/${material.id}/results` },
        ]}
      />
      <PageHeader title={`Результаты — ${material.title}`} description="Прогресс учеников и проверка ответов." />

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет групп с доступом — некому показывать результаты.</p>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Сводка</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Группа</TableHead>
                  <TableHead>Пройдено</TableHead>
                  <TableHead>Средний балл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student.id}>
                    <TableCell>
                      <Link href={`/materials/${material.id}/results/${r.student.id}`} className="font-medium text-primary hover:underline">
                        {r.student.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{(studentGroups[r.student.id] ?? []).join(", ") || "—"}</TableCell>
                    <TableCell>{r.answered} / {gradable.length}</TableCell>
                    <TableCell>{r.avg === null ? "—" : `${r.avg}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">На проверке (свободные ответы)</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет ответов, ожидающих проверки.</p>
        ) : (
          pending.map(({ f, student, sub }) => {
            const answer = (sub!.answer ?? {}) as { text?: string };
            const prompt = (f.item.content as unknown as FreeContent).prompt;
            return (
              <Card key={`${student.id}:${f.item.id}`}>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">
                    {student.full_name} · {f.lessonTitle} / {f.moduleTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{prompt}</p>
                  <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-sm">{answer.text}</p>
                  <GradeForm studentId={student.id} itemId={f.item.id} materialId={material.id} initialScore={sub!.score} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
