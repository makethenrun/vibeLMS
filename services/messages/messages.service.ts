import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { MessageRow } from "@/types";

export interface Peer {
  id: string;
  name: string;
  unread: number;
}

async function studentUserIdsForGroups(db: Db, groupIds: string[]): Promise<string[]> {
  if (groupIds.length === 0) return [];
  const { data: gm } = await db.from("group_members").select("student_id").in("group_id", groupIds);
  const studentIds = [...new Set((gm ?? []).map((r) => r.student_id))];
  if (studentIds.length === 0) return [];
  const { data: st } = await db.from("students").select("user_id").in("id", studentIds).not("user_id", "is", null);
  return (st ?? []).map((s) => s.user_id).filter((v): v is string => Boolean(v));
}

/**
 * The user ids the current user may message:
 *  - TUTOR ↔ all assistants and students
 *  - ASSISTANT ↔ tutors + students of their assigned groups
 *  - STUDENT ↔ tutors + assistants assigned to their groups
 */
export async function allowedPeerIds(db: Db, user: CurrentUser): Promise<string[]> {
  if (user.role === "TUTOR") {
    const { data } = await db.from("users").select("id").in("role", ["ASSISTANT", "STUDENT"]);
    return (data ?? []).map((u) => u.id);
  }

  const { data: tutors } = await db.from("users").select("id").eq("role", "TUTOR");
  const tutorIds = (tutors ?? []).map((u) => u.id);

  if (user.role === "ASSISTANT") {
    const { data: ag } = await db.from("assistant_groups").select("group_id").eq("assistant_id", user.id);
    const students = await studentUserIdsForGroups(db, (ag ?? []).map((r) => r.group_id));
    return [...tutorIds, ...students];
  }

  if (user.role === "STUDENT") {
    const { data: me } = await db.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!me) return tutorIds;
    const { data: gm } = await db.from("group_members").select("group_id").eq("student_id", me.id);
    const groupIds = (gm ?? []).map((r) => r.group_id);
    let assistantIds: string[] = [];
    if (groupIds.length > 0) {
      const { data: ag } = await db.from("assistant_groups").select("assistant_id").in("group_id", groupIds);
      assistantIds = [...new Set((ag ?? []).map((r) => r.assistant_id))];
    }
    return [...tutorIds, ...assistantIds];
  }
  return [];
}

export async function isPeer(db: Db, user: CurrentUser, peerId: string): Promise<boolean> {
  return (await allowedPeerIds(db, user)).includes(peerId);
}

/** The people the current user can message, with unread counts and display names. */
export async function listPeers(db: Db, user: CurrentUser): Promise<Peer[]> {
  const ids = await allowedPeerIds(db, user);
  if (ids.length === 0) return [];

  const { data: users } = await db.from("users").select("id, login, role").in("id", ids);
  const rows = users ?? [];

  const studentUserIds = rows.filter((u) => u.role === "STUDENT").map((u) => u.id);
  const nameByUser = new Map<string, string>();
  if (studentUserIds.length > 0) {
    const { data: st } = await db.from("students").select("user_id, full_name").in("user_id", studentUserIds);
    for (const s of st ?? []) if (s.user_id) nameByUser.set(s.user_id, s.full_name);
  }

  const { data: unread } = await db.from("messages").select("sender_id").eq("recipient_id", user.id).is("read_at", null);
  const unreadBySender = new Map<string, number>();
  for (const m of unread ?? []) unreadBySender.set(m.sender_id, (unreadBySender.get(m.sender_id) ?? 0) + 1);

  return rows
    .map((u) => ({ id: u.id, name: nameByUser.get(u.id) ?? u.login, unread: unreadBySender.get(u.id) ?? 0 }))
    .sort((a, b) => b.unread - a.unread || a.name.localeCompare(b.name));
}

export async function totalUnread(db: Db, userId: string): Promise<number> {
  const { count } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/** Full conversation between two users, oldest first. */
export async function getConversation(db: Db, userId: string, peerId: string): Promise<MessageRow[]> {
  const { data } = await db
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(500);
  return data ?? [];
}

export async function markRead(db: Db, userId: string, peerId: string): Promise<void> {
  await db
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("sender_id", peerId)
    .is("read_at", null);
}

export async function sendMessage(db: Db, senderId: string, recipientId: string, body: string): Promise<MessageRow> {
  const { data, error } = await db
    .from("messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, body })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMessage(db: Db, messageId: string): Promise<void> {
  const { error } = await db.from("messages").delete().eq("id", messageId);
  if (error) throw new Error(error.message);
}
