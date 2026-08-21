"use server";

import { getStaffOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import type { MessageRow } from "@/types";
import * as messages from "@/services/messages/messages.service";

export async function listPeersAction(): Promise<ActionResult<{ peers: messages.Peer[] }>> {
  const user = await getStaffOrNull();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    return ok({ peers: await messages.listPeers(db, user) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function unreadCountAction(): Promise<ActionResult<{ count: number }>> {
  const user = await getStaffOrNull();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    return ok({ count: await messages.totalUnread(db, user.id) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function openConversationAction(peerId: string): Promise<ActionResult<{ meId: string; messages: MessageRow[] }>> {
  const user = await getStaffOrNull();
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

export async function sendMessageAction(peerId: string, body: string): Promise<ActionResult<{ message: MessageRow }>> {
  const user = await getStaffOrNull();
  if (!user) return fail("Недостаточно прав");
  const text = body.trim();
  if (text === "") return fail("Пустое сообщение");
  if (text.length > 4000) return fail("Слишком длинное сообщение");
  const db = createServerSupabaseClient();
  try {
    if (!(await messages.isPeer(db, user, peerId))) return fail("Нет доступа");
    return ok({ message: await messages.sendMessage(db, user.id, peerId, text) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}
