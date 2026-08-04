import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import type { MaterialItemType } from "@/types";
import { Workspace } from "../../../../../_components/workspace";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { StudentModuleTree } from "@/app/(app)/learn/_components/student-module-tree";
import { ReactionPicker } from "../../../reaction-picker";

export const metadata: Metadata = { title: "Результаты урока" };

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
      <PageHeader title={`${ctx.title} — ${student.full_name}`} description="Материал глазами ученика с его результатами и реакциями." />
      <Workspace
        tree={<StudentModuleTree lessonHref={`${base}/lessons/${lessonId}`} modules={modules} activeModuleId={active?.id} />}
        treeTitle="Модули и упражнения"
      >
        {active ? (
          <PreviewProvider>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              {active.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">В модуле нет элементов.</p>
              ) : (
                active.items.map((item) => {
                  const sub = subs[item.id];
                  const withReaction = sub && !NON_GRADABLE.includes(item.type);
                  return (
                    <StudentItem
                      key={item.id}
                      item={item}
                      submission={sub}
                      reactionPicker={
                        withReaction ? (
                          <ReactionPicker studentId={student.id} itemId={item.id} materialId={materialId} current={sub!.reaction} />
                        ) : undefined
                      }
                    />
                  );
                })
              )}
            </section>
          </PreviewProvider>
        ) : (
          <p className="text-sm text-muted-foreground">В уроке нет модулей.</p>
        )}
      </Workspace>
    </div>
  );
}
