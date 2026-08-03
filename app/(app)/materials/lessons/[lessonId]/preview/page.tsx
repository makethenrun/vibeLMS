import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
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
  await requireTutor();
  const { lessonId } = await params;
  const { m } = await searchParams;

  const db = createServerSupabaseClient();
  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();

  const modules = await getLessonModules(db, lessonId);
  const active = modules.find((mod) => mod.id === m) ?? modules[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ctx.title}
        description="Так урок видит ученик. Ответы проверяются, но не сохраняются."
        actions={
          <>
            <Badge variant="secondary">Просмотр как ученик</Badge>
            <Button asChild variant="outline">
              <Link href={`/materials/lessons/${lessonId}`}>
                <Pencil className="h-4 w-4" />
                К редактированию
              </Link>
            </Button>
          </>
        }
      />
      <Workspace
        tree={<StudentModuleTree lessonHref={`/materials/lessons/${lessonId}/preview`} modules={modules} activeModuleId={active?.id} />}
        treeTitle="Модули и упражнения"
      >
        {active ? (
          <PreviewProvider>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{active.title}</h2>
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
    </div>
  );
}
