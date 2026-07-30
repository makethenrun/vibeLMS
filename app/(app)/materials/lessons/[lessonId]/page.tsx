import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonCrumbs } from "@/services/materials/breadcrumbs.service";
import { listModules } from "@/services/materials/modules.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { ModuleList } from "./module-list";

export const metadata: Metadata = { title: "Урок" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  await requireTutor();
  const { lessonId } = await params;

  const db = createServerSupabaseClient();
  const crumb = await lessonCrumbs(db, lessonId);
  if (!crumb) notFound();

  const modules = await listModules(db, lessonId);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={crumb.crumbs} />
      <PageHeader title={crumb.title} description="Модули урока." />
      <ModuleList lessonId={lessonId} modules={modules} />
    </div>
  );
}
