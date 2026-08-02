import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getSubmissionsForItems } from "@/services/materials/submissions.service";
import {
  lessonMaterialId,
  studentHasMaterialAccess,
} from "@/services/materials/student-access.service";
import { StudentItem } from "../../_components/student-item";

export const metadata: Metadata = { title: "Урок" };

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { studentId } = await requireStudent();
  const { lessonId } = await params;

  const db = createServerSupabaseClient();
  const materialId = await lessonMaterialId(db, lessonId);
  if (!materialId || !(await studentHasMaterialAccess(db, studentId, materialId))) notFound();

  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();

  const modules = await getLessonModules(db, lessonId);
  const itemIds = modules.flatMap((m) => m.items.map((i) => i.id));
  const submissions = await getSubmissionsForItems(db, studentId, itemIds);

  return (
    <div className="space-y-6">
      <PageHeader title={ctx.title} description="Пройдите упражнения урока." />

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">В уроке пока нет содержимого.</p>
      ) : (
        <div className="space-y-8">
          {modules.map((module) => (
            <section key={module.id} className="space-y-3">
              <h2 className="text-lg font-semibold">{module.title}</h2>
              {module.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет элементов.</p>
              ) : (
                module.items.map((item) => (
                  <StudentItem key={item.id} item={item} submission={submissions[item.id]} />
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
