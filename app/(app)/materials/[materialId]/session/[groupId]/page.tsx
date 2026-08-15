import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getGroup } from "@/services/groups/groups.service";
import { getMaterial } from "@/services/materials/materials.service";
import { getMaterialItemsFlat } from "@/services/materials/results.service";
import { getActiveSession, getSessionStudents, toState } from "@/services/materials/live-session.service";
import { SessionConsole } from "./session-console";
import { StartSessionScreen } from "./start-session";

export const metadata: Metadata = { title: "Занятие" };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ materialId: string; groupId: string }>;
}) {
  await requireTutor();
  const { materialId, groupId } = await params;

  const db = createServerSupabaseClient();
  const [material, group] = await Promise.all([getMaterial(db, materialId), getGroup(db, groupId)]);
  if (!material || !group) notFound();

  const session = await getActiveSession(db, groupId);

  if (!session || session.material_id !== materialId) {
    return (
      <StartSessionScreen
        materialId={materialId}
        groupId={groupId}
        materialTitle={material.title}
        groupName={group.name}
        conflict={Boolean(session && session.material_id !== materialId)}
      />
    );
  }

  const [flat, students] = await Promise.all([
    getMaterialItemsFlat(db, materialId),
    getSessionStudents(db, groupId),
  ]);

  const items = flat.map((f) => ({
    id: f.item.id,
    title: f.item.title,
    type: f.item.type,
    lessonTitle: f.lessonTitle,
    moduleTitle: f.moduleTitle,
    item: f.item,
  }));

  return (
    <SessionConsole
      sessionId={session.id}
      materialTitle={material.title}
      groupName={group.name}
      groupId={groupId}
      items={items}
      students={students.map((s) => ({ id: s.id, fullName: s.full_name }))}
      initialState={toState(session)}
    />
  );
}
