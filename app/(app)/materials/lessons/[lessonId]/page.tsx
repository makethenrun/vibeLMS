import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonContext } from "@/services/materials/breadcrumbs.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";
import { listItems } from "@/services/materials/items.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { ItemList } from "../../_components/item-list";
import { MaterialTree } from "../../_components/material-tree";
import { Workspace } from "../../_components/workspace";

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

  const [tree, items] = await Promise.all([
    getMaterialTree(db, ctx.materialId),
    listItems(db, lessonId),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={ctx.crumbs} />
      <PageHeader title={ctx.title} description="Упражнения и обучающая информация урока." />
      <Workspace tree={<MaterialTree materialId={ctx.materialId} activeLessonId={lessonId} tree={tree} />}>
        <ItemList lessonId={lessonId} items={items} />
      </Workspace>
    </div>
  );
}
