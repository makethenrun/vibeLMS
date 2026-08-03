import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { GRADABLE_TYPES, getMaterialItemsFlat } from "@/services/materials/results.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import type { FreeContent } from "@/lib/validators";
import type { MaterialItemType } from "@/types";
import { ScoreBadge } from "@/app/(app)/learn/_components/score-badge";
import { Breadcrumbs } from "../../../_components/breadcrumbs";
import { ReactionPicker } from "../reaction-picker";

export const metadata: Metadata = { title: "Результаты ученика" };

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Обучающая информация", QUIZ: "Тест", GAPS: "Заполнить пропуски", FREE: "Свободный ответ",
  MATCH: "Сопоставление пар", AUDIO: "Аудио", VIDEO: "Видео", IMAGE: "Изображение",
  CAROUSEL: "Карусель", LINK: "Ссылка", IMAGE_TASK: "Упражнение с изображениями", SENTENCE_TASK: "Работа с предложениями",
};

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

  const flat = (await getMaterialItemsFlat(db, materialId)).filter((f) => GRADABLE_TYPES.includes(f.item.type));
  const subs = await getSubmissionsForItems(db, studentId, flat.map((f) => f.item.id));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Материалы", href: "/materials" },
          { label: material.title, href: `/materials/${material.id}` },
          { label: "Результаты", href: `/materials/${material.id}/results` },
          { label: student.full_name, href: `/materials/${material.id}/results/${student.id}` },
        ]}
      />
      <PageHeader title={student.full_name} description={`Материал «${material.title}» — ответы и результаты.`} />

      {flat.length === 0 ? (
        <p className="text-sm text-muted-foreground">В материале нет упражнений.</p>
      ) : (
        <div className="space-y-3">
          {flat.map(({ item, lessonTitle, moduleTitle }) => {
            const sub = subs[item.id];
            const answer = (sub?.answer ?? {}) as { text?: string };
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b py-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{item.title || TYPE_LABELS[item.type]}</CardTitle>
                    <p className="text-xs text-muted-foreground">{lessonTitle} / {moduleTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub ? <ScoreBadge score={sub.score} /> : <span className="text-xs text-muted-foreground">не пройдено</span>}
                    {sub ? (
                      <ReactionPicker studentId={student.id} itemId={item.id} materialId={material.id} current={sub.reaction} />
                    ) : null}
                  </div>
                </CardHeader>
                {item.type === "FREE" && answer.text ? (
                  <CardContent className="pt-3">
                    <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-sm">{answer.text}</p>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
