import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { MessageRow, UserRole } from "@/types";

export interface Peer {
  id: string;
  login: string;
  unread: number;
}

/** The role a user talks to: tutors ↔ assistants. */
function peerRole(role: UserRole): UserRole | null {
  if (role === "TUTOR") return "ASSISTANT";
  if (role === "ASSISTANT") return "TUTOR";
  return null;
}

export async function isPeer(db: Db, user: CurrentUser, peerId: string): Promise<boolean> {
  const want = peerRole(user.role);
  if (!want) return false;
  const { data } = await db.from("users").select("role").eq("id", peerId).maybeSingle();
  return data?.role === want;
}

/** The people the current user can message, with unread counts. */
export async function listPeers(db: Db, user: CurrentUser): Promise<Peer[]> {
  const want = peerRole(user.role);
  if (!want) return [];
  const { data: users } = await db
    .from("users")
    .select("id, login")
    .eq("role", want)
    .order("login", { ascending: true });
  const rows = users ?? [];
  if (rows.length === 0) return [];

  const { data: unread } = await db
    .from("messages")
    .select("sender_id")
    .eq("recipient_id", user.id)
    .is("read_at", null);
  const unreadBySender = new Map<string, number>();
  for (const m of unread ?? []) unreadBySender.set(m.sender_id, (unreadBySender.get(m.sender_id) ?? 0) + 1);

  return rows.map((u) => ({ id: u.id, login: u.login, unread: unreadBySender.get(u.id) ?? 0 }));
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
