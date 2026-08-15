import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterialItemsFlat } from "@/services/materials/results.service";
import { getActiveSessionForStudent, toState } from "@/services/materials/live-session.service";
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

  const flat = await getMaterialItemsFlat(db, session.material_id);
  const items = flat.map((f) => f.item);

  let initialSubmission = null;
  if (session.active_item_id) {
    const { data } = await db
      .from("material_item_submissions")
      .select("*")
      .eq("student_id", studentId)
      .eq("item_id", session.active_item_id)
      .maybeSingle();
    initialSubmission = data ?? null;
  }

  return (
    <StudentLive
      sessionId={session.id}
      items={items}
      initialState={toState(session)}
      initialSubmission={initialSubmission}
    />
  );
}
