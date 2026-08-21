import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireStaff } from "@/lib/auth/guards";
import { canAccessGroup, canViewMaterial } from "@/services/assistants/assistants.service";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getGroup } from "@/services/groups/groups.service";
import { getMaterial } from "@/services/materials/materials.service";
import { itemsForScope } from "@/lib/materials/scope";
import { getMaterialItemsFlat } from "@/services/materials/results.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";
import { getActiveSession, getDrawings, getSessionStudents, TUTOR_AUTHOR, toState } from "@/services/materials/live-session.service";
import { SessionConsole } from "./session-console";
import { StartSessionScreen } from "./start-session";

export const metadata: Metadata = { title: "Занятие" };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ materialId: string; groupId: string }>;
}) {
  const user = await requireStaff();
  const { materialId, groupId } = await params;

  const db = createServerSupabaseClient();
  if (user.role === "ASSISTANT" && !((await canAccessGroup(db, user, groupId)) && (await canViewMaterial(db, user, materialId)))) {
    notFound();
  }
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

  const [flat, tree, students] = await Promise.all([
    getMaterialItemsFlat(db, materialId),
    getMaterialTree(db, materialId),
    getSessionStudents(db, groupId),
  ]);

  const items = flat.map((f) => ({ id: f.item.id, item: f.item }));
  const state = toState(session);
  const scopeItemIds = itemsForScope(tree, state.kind, state.scopeId);
  const initialTutorDrawings = await getDrawings(db, session.id, scopeItemIds, TUTOR_AUTHOR);

  return (
    <SessionConsole
      sessionId={session.id}
      materialTitle={material.title}
      groupName={group.name}
      groupId={groupId}
      items={items}
      tree={tree}
      students={students.map((s) => ({ id: s.id, fullName: s.full_name }))}
      initialState={state}
      initialTutorDrawings={initialTutorDrawings}
    />
  );
}
