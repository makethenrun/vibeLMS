import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { getAccessibleGroups } from "@/services/materials/material-groups.service";
import { getPinsForItems } from "@/services/materials/item-pins.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { ModulePane } from "../../_components/module-pane";
import { Workspace } from "../../_components/workspace";
import { ModuleTree } from "./module-tree";

export const metadata: Metadata = { title: "Урок" };

export default async function LessonPage({
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

  const [availableGroups, pins] = await Promise.all([
    getAccessibleGroups(db, ctx.materialId),
    active ? getPinsForItems(db, active.items.map((i) => i.id)) : Promise.resolve({}),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={ctx.crumbs} />
      <PageHeader
        title={ctx.title}
        description="Один модуль на странице; переключайтесь в списке справа."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/materials/${ctx.materialId}/results`}>
                <BarChart3 className="h-4 w-4" />
                Результаты
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/materials/lessons/${lessonId}/preview`}>
                <Eye className="h-4 w-4" />
                Просмотр как ученик
              </Link>
            </Button>
          </>
        }
      />
      <Workspace
        tree={<ModuleTree lessonId={lessonId} modules={modules} activeModuleId={active?.id} />}
        treeTitle="Модули"
      >
        {active ? (
          <ModulePane module={active} availableGroups={availableGroups} pins={pins} />
        ) : (
          <p className="text-sm text-muted-foreground">
            В уроке пока нет модулей. Добавьте первый модуль в списке справа.
          </p>
        )}
      </Workspace>
    </div>
  );
}
