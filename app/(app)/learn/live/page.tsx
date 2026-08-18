import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { itemsForScope } from "@/lib/materials/scope";
import { getMaterialItemsFlat } from "@/services/materials/results.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";
import { getActiveSessionForStudent, toState } from "@/services/materials/live-session.service";
import type { ItemSubmissionRow } from "@/types";
import { StudentLive } from "./student-live";

export const metadata: Metadata = { title: "Занятие" };

export default async function StudentLivePage() {
  const { studentId } = await requireStudent();
  const db = createServerSupabaseClient();

  const session = await getActiveSessionForStudent(db, studentId);
  if (!session) {
    return (
      <div className="space-y-4">
        <PageHeader title="Живое занятие" description="Сейчас нет активного занятия." />
        <Button asChild variant="outline">
          <Link href="/learn">К материалам</Link>
        </Button>
      </div>
    );
  }

  const [flat, tree] = await Promise.all([
    getMaterialItemsFlat(db, session.material_id),
    getMaterialTree(db, session.material_id),
  ]);
  const items = flat.map((f) => f.item);
  const state = toState(session);
  const initialItemIds = itemsForScope(tree, state.kind, state.scopeId);

  const initialSubmissions: Record<string, ItemSubmissionRow> = {};
  if (initialItemIds.length > 0) {
    const { data } = await db
      .from("material_item_submissions")
      .select("*")
      .eq("student_id", studentId)
      .in("item_id", initialItemIds);
    for (const row of data ?? []) initialSubmissions[row.item_id] = row;
  }

  return (
    <StudentLive
      sessionId={session.id}
      items={items}
      initialState={state}
      initialItemIds={initialItemIds}
      initialSubmissions={initialSubmissions}
    />
  );
}
