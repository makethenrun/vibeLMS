import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/guards";
import { canEditMaterial, canViewMaterial } from "@/services/assistants/assistants.service";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getLessonBackground } from "@/services/materials/lessons.service";
import { LessonSurface } from "../../../_components/lesson-surface";
import { Workspace } from "../../../_components/workspace";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { StudentModuleTree } from "@/app/(app)/learn/_components/student-module-tree";

export const metadata: Metadata = { title: "Просмотр урока" };

export default async function LessonPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireStaff();
  const { lessonId } = await params;
  const { m } = await searchParams;

  const db = createServerSupabaseClient();
  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();
  if (!(await canViewMaterial(db, user, ctx.materialId))) notFound();
  const canEdit = await canEditMaterial(db, user, ctx.materialId);

  const modules = await getLessonModules(db, lessonId);
  const active = modules.find((mod) => mod.id === m) ?? modules[0];
  const background = await getLessonBackground(db, lessonId);

  return (
    <div className="space-y-6">
      <LessonSurface
        background={background}
        header={
          <PageHeader
            title={ctx.title}
            description="Так урок видит ученик. Ответы проверяются, но не сохраняются."
            actions={<Badge variant="secondary">Просмотр как ученик</Badge>}
          />
        }
      >
        <Workspace
          tree={<StudentModuleTree lessonHref={`/materials/lessons/${lessonId}/preview`} modules={modules} activeModuleId={active?.id} />}
          treeTitle="Модули и упражнения"
          navActions={
            canEdit ? (
              <Button asChild size="icon" variant="outline" className="h-11 w-11 rounded-full" title="К редактированию">
                <Link href={`/materials/lessons/${lessonId}`} aria-label="К редактированию">
                  <Pencil className="h-5 w-5" />
                </Link>
              </Button>
            ) : undefined
          }
        >
          {active ? (
            <PreviewProvider>
              <section className="space-y-4">
                <h2 className={active && background.url ? "inline-block rounded-md bg-card/95 px-3 py-1 text-lg font-semibold shadow-sm" : "text-lg font-semibold"}>{active.title}</h2>
                {active.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">В модуле нет элементов.</p>
                ) : (
                  active.items.map((item) => <StudentItem key={item.id} item={item} />)
                )}
              </section>
            </PreviewProvider>
          ) : (
            <p className="text-sm text-muted-foreground">В уроке нет модулей.</p>
          )}
        </Workspace>
      </LessonSurface>
    </div>
  );
}
