"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import type { MessageRow } from "@/types";
import * as messages from "@/services/messages/messages.service";

export async function listPeersAction(): Promise<ActionResult<{ peers: messages.Peer[] }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    return ok({ peers: await messages.listPeers(db, user) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function unreadCountAction(): Promise<ActionResult<{ count: number }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    return ok({ count: await messages.totalUnread(db, user.id) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function openConversationAction(peerId: string): Promise<ActionResult<{ meId: string; messages: MessageRow[] }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    if (!(await messages.isPeer(db, user, peerId))) return fail("Нет доступа");
    await messages.markRead(db, user.id, peerId);
    const list = await messages.getConversation(db, user.id, peerId);
    return ok({ meId: user.id, messages: list });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function sendMessageAction(
  peerId: string,
  body: string,
  attachmentUrl?: string | null,
  attachmentName?: string | null,
): Promise<ActionResult<{ message: MessageRow }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const text = body.trim();
  const attach = attachmentUrl && attachmentUrl.trim() !== "" ? attachmentUrl.trim() : null;
  if (text === "" && !attach) return fail("Пустое сообщение");
  if (text.length > 4000) return fail("Слишком длинное сообщение");
  if (attach && !attach.startsWith("http")) return fail("Некорректный файл");
  const db = createServerSupabaseClient();
  try {
    if (!(await messages.isPeer(db, user, peerId))) return fail("Нет доступа");
    const message = await messages.sendMessage(db, user.id, peerId, text, attach, attach ? attachmentName ?? "файл" : null);
    return ok({ message });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Deleting messages is reserved for the main tutor. */
export async function deleteMessageAction(messageId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "TUTOR") return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await messages.deleteMessage(db, messageId);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}
