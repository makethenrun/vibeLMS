import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { sectionContext } from "@/services/materials/breadcrumbs.service";
import { listLessons } from "@/services/materials/lessons.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { Workspace } from "../../_components/workspace";
import { LessonsPanel } from "./lessons-panel";

export const metadata: Metadata = { title: "Раздел" };

export default async function SectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  await requireTutor();
  const { sectionId } = await params;

  const db = createServerSupabaseClient();
  const ctx = await sectionContext(db, sectionId);
  if (!ctx) notFound();

  const lessons = await listLessons(db, sectionId);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={ctx.crumbs} />
      <PageHeader title={ctx.title} description="Уроки раздела." />
      <Workspace tree={<LessonsPanel sectionId={sectionId} lessons={lessons} />} treeTitle="Уроки">
        <EmptyState
          icon={BookOpen}
          title="Выберите урок"
          description="Выберите урок справа или создайте новый."
        />
      </Workspace>
    </div>
  );
}
