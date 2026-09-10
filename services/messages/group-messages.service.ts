import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { CurrentUser } from "@/lib/auth/current-user";
import { namesForUsers } from "./messages.service";

export interface GroupChat {
  id: string;
  name: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  senderName: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

/** Group ids the user participates in: student's groups, assistant's assigned
 *  groups, or all groups for the tutor. */
export async function userGroupIds(db: Db, user: CurrentUser): Promise<string[]> {
  if (user.role === "TUTOR") {
    const { data } = await db.from("groups").select("id");
    return (data ?? []).map((g) => g.id);
  }
  if (user.role === "ASSISTANT") {
    const { data } = await db.from("assistant_groups").select("group_id").eq("assistant_id", user.id);
    return (data ?? []).map((r) => r.group_id);
  }
  // STUDENT
  const { data: me } = await db.from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!me) return [];
  const { data: gm } = await db.from("group_members").select("group_id").eq("student_id", me.id);
  return (gm ?? []).map((r) => r.group_id);
}

export async function canAccessGroupChat(db: Db, user: CurrentUser, groupId: string): Promise<boolean> {
  return (await userGroupIds(db, user)).includes(groupId);
}

/** The group chats available to the user, alphabetically. */
export async function listGroupChats(db: Db, user: CurrentUser): Promise<GroupChat[]> {
  const ids = await userGroupIds(db, user);
  if (ids.length === 0) return [];
  const { data } = await db.from("groups").select("id, name").in("id", ids).order("name", { ascending: true });
  return (data ?? []).map((g) => ({ id: g.id, name: g.name }));
}

/** A group's messages, oldest first, with sender display names. */
export async function getGroupMessages(db: Db, groupId: string): Promise<GroupMessage[]> {
  const { data } = await db
    .from("group_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(500);
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const names = await namesForUsers(db, [...new Set(rows.map((m) => m.sender_id))]);
  return rows.map((m) => ({ ...m, senderName: names.get(m.sender_id) ?? "—" }));
}

export async function sendGroupMessage(
  db: Db,
  groupId: string,
  senderId: string,
  body: string,
  attachmentUrl?: string | null,
  attachmentName?: string | null,
): Promise<GroupMessage> {
  const { data, error } = await db
    .from("group_messages")
    .insert({
      group_id: groupId,
      sender_id: senderId,
      body,
      attachment_url: attachmentUrl ?? null,
      attachment_name: attachmentName ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const names = await namesForUsers(db, [senderId]);
  return { ...data, senderName: names.get(senderId) ?? "—" };
}

export async function deleteGroupMessage(db: Db, messageId: string): Promise<void> {
  const { error } = await db.from("group_messages").delete().eq("id", messageId);
  if (error) throw new Error(error.message);
}
