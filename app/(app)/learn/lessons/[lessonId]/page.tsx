import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import { getLessonBackground } from "@/services/materials/lessons.service";
import { lessonMaterialId, studentHasMaterialAccess } from "@/services/materials/student-access.service";
import { LessonSurface } from "@/app/(app)/materials/_components/lesson-surface";
import { Workspace } from "@/app/(app)/materials/_components/workspace";
import { StudentItem } from "../../_components/student-item";
import { StudentModuleTree } from "../../_components/student-module-tree";

export const metadata: Metadata = { title: "Урок" };

export default async function StudentLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { studentId } = await requireStudent();
  const { lessonId } = await params;
  const { m } = await searchParams;

  const db = createServerSupabaseClient();
  const materialId = await lessonMaterialId(db, lessonId);
  if (!materialId || !(await studentHasMaterialAccess(db, studentId, materialId))) notFound();

  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();

  const modules = await getLessonModules(db, lessonId);
  const active = modules.find((mod) => mod.id === m) ?? modules[0];
  const submissions = active ? await getSubmissionsForItems(db, studentId, active.items.map((i) => i.id)) : {};
  const background = await getLessonBackground(db, lessonId);

  return (
    <div className="space-y-6">
      <PageHeader title={ctx.title} description="Пройдите упражнения модуля." />
      <LessonSurface backgroundUrl={background.url} dim={background.dim}>
        <Workspace
          tree={<StudentModuleTree lessonHref={`/learn/lessons/${lessonId}`} modules={modules} activeModuleId={active?.id} />}
          treeTitle="Модули и упражнения"
        >
          {active ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              {active.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">В модуле пока нет элементов.</p>
              ) : (
                active.items.map((item) => <StudentItem key={item.id} item={item} submission={submissions[item.id]} />)
              )}
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">В уроке пока нет модулей.</p>
          )}
        </Workspace>
      </LessonSurface>
    </div>
  );
}
