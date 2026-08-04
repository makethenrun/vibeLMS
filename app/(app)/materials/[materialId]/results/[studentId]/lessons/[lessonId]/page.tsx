import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import type { FreeContent } from "@/lib/validators";
import type { MaterialItemType } from "@/types";
import { Workspace } from "../../../../../_components/workspace";
import { ScoreBadge } from "@/app/(app)/learn/_components/score-badge";
import { StudentModuleTree } from "@/app/(app)/learn/_components/student-module-tree";
import { ReactionPicker } from "../../../reaction-picker";

export const metadata: Metadata = { title: "Результаты урока" };

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Обучающая информация", QUIZ: "Тест", GAPS: "Заполнить пропуски", FREE: "Свободный ответ",
  MATCH: "Сопоставление пар", AUDIO: "Аудио", VIDEO: "Видео", IMAGE: "Изображение",
  CAROUSEL: "Карусель", LINK: "Ссылка", IMAGE_TASK: "Упражнение с изображениями", SENTENCE_TASK: "Работа с предложениями",
};

const NON_GRADABLE: MaterialItemType[] = ["INFO", "AUDIO", "VIDEO", "IMAGE", "CAROUSEL", "LINK"];

export default async function LessonResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ materialId: string; studentId: string; lessonId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  await requireTutor();
  const { materialId, studentId, lessonId } = await params;
  const { m } = await searchParams;

  const db = createServerSupabaseClient();
  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();
  const { data: student } = await db.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

  const modules = await getLessonModules(db, lessonId);
  const active = modules.find((mod) => mod.id === m) ?? modules[0];
  const subs = active ? await getSubmissionsForItems(db, studentId, active.items.map((i) => i.id)) : {};

  const base = `/materials/${materialId}/results/${studentId}`;

  return (
    <div className="space-y-6">
      <PageHeader title={`${ctx.title} — ${student.full_name}`} description="Ответы и результаты ученика." />
      <Workspace
        tree={<StudentModuleTree lessonHref={`${base}/lessons/${lessonId}`} modules={modules} activeModuleId={active?.id} />}
        treeTitle="Модули и упражнения"
      >
        {active ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{active.title}</h2>
            {active.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">В модуле нет элементов.</p>
            ) : (
              active.items.map((item) => {
                const sub = subs[item.id];
                const answer = (sub?.answer ?? {}) as { text?: string };
                const gradable = !NON_GRADABLE.includes(item.type);
                return (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b py-2">
                      <CardTitle className="truncate text-sm">{item.title || TYPE_LABELS[item.type]}</CardTitle>
                      <div className="flex items-center gap-2">
                        {gradable ? (sub ? <ScoreBadge score={sub.score} /> : <span className="text-xs text-muted-foreground">не пройдено</span>) : null}
                        {gradable && sub ? (
                          <ReactionPicker studentId={student.id} itemId={item.id} materialId={materialId} current={sub.reaction} />
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
              })
            )}
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">В уроке нет модулей.</p>
        )}
      </Workspace>
    </div>
  );
}
