"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import * as chats from "@/services/messages/group-messages.service";

export async function listGroupChatsAction(): Promise<ActionResult<{ chats: chats.GroupChat[] }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    return ok({ chats: await chats.listGroupChats(db, user) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function openGroupChatAction(groupId: string): Promise<ActionResult<{ meId: string; role: string; messages: chats.GroupMessage[] }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    if (!(await chats.canAccessGroupChat(db, user, groupId))) return fail("Нет доступа");
    return ok({ meId: user.id, role: user.role, messages: await chats.getGroupMessages(db, groupId) });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function sendGroupMessageAction(
  groupId: string,
  body: string,
  attachmentUrl?: string | null,
  attachmentName?: string | null,
): Promise<ActionResult<{ message: chats.GroupMessage }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Недостаточно прав");
  const text = body.trim();
  const attach = attachmentUrl && attachmentUrl.trim() !== "" ? attachmentUrl.trim() : null;
  if (text === "" && !attach) return fail("Пустое сообщение");
  if (text.length > 4000) return fail("Слишком длинное сообщение");
  if (attach && !attach.startsWith("http")) return fail("Некорректный файл");
  const db = createServerSupabaseClient();
  try {
    if (!(await chats.canAccessGroupChat(db, user, groupId))) return fail("Нет доступа");
    const message = await chats.sendGroupMessage(db, groupId, user.id, text, attach, attach ? attachmentName ?? "файл" : null);
    return ok({ message });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Deleting group messages is reserved for the main tutor. */
export async function deleteGroupMessageAction(messageId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "TUTOR") return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await chats.deleteGroupMessage(db, messageId);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}
