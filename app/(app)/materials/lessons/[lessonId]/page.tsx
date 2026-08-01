import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getLessonModules } from "@/services/materials/lesson-content.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { LessonEditor } from "../../_components/lesson-editor";
import { Workspace } from "../../_components/workspace";
import { ModulesPanel } from "./modules-panel";

export const metadata: Metadata = { title: "Урок" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  await requireTutor();
  const { lessonId } = await params;

  const db = createServerSupabaseClient();
  const ctx = await lessonContext(db, lessonId);
  if (!ctx) notFound();

  const modules = await getLessonModules(db, lessonId);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={ctx.crumbs} />
      <PageHeader title={ctx.title} description="Модули, упражнения и обучающая информация урока." />
      <Workspace
        tree={<ModulesPanel lessonId={lessonId} modules={modules} />}
        treeTitle="Модули"
      >
        <LessonEditor lessonId={lessonId} modules={modules} />
      </Workspace>
    </div>
  );
}
