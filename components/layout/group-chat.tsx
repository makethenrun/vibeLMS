"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Paperclip, Send, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db/database.types";
import type { GroupChat as GroupChatItem, GroupMessage } from "@/services/messages/group-messages.service";
import {
  deleteGroupMessageAction,
  listGroupChatsAction,
  openGroupChatAction,
  sendGroupMessageAction,
} from "@/app/(app)/messages/group-actions";

export function GroupChat({ role }: { role: UserRole }) {
  const isTutor = role === "TUTOR";
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<GroupChatItem[]>([]);
  const [chat, setChat] = useState<GroupChatItem | null>(null);
  const [thread, setThread] = useState<GroupMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const loadChats = useCallback(async () => {
    const r = await listGroupChatsAction();
    if (r.success) setChats(r.data.chats);
  }, []);

  const loadThread = useCallback(async (groupId: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await openGroupChatAction(groupId);
      if (r.success) { setThread(r.data.messages); setMeId(r.data.meId); }
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!open || chat) return;
    loadChats();
  }, [open, chat, loadChats]);

  useEffect(() => {
    if (!open || !chat) return;
    loadThread(chat.id);
    const id = setInterval(() => loadThread(chat.id), 3000);
    return () => clearInterval(id);
  }, [open, chat, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "chat");
      const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Ошибка загрузки");
      setAttachment({ url: data.url, name: file.name });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    if (!chat || (text.trim() === "" && !attachment)) return;
    setSending(true);
    const body = text;
    const att = attachment;
    setText("");
    setAttachment(null);
    const r = await sendGroupMessageAction(chat.id, body, att?.url ?? null, att?.name ?? null);
    setSending(false);
    if (r.success) setThread((prev) => [...prev, r.data.message]);
    else { setText(body); setAttachment(att); toast.error(r.error); }
  }

  async function remove(id: string) {
    setThread((prev) => prev.filter((m) => m.id !== id));
    await deleteGroupMessageAction(id);
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Групповые чаты" title="Групповые чаты">
        <Users className="h-5 w-5" />
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              {chat ? (
                <button type="button" onClick={() => setChat(null)} aria-label="Назад" className="rounded p-1 hover:bg-accent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <p className="flex-1 truncate text-sm font-semibold">{chat ? chat.name : "Групповые чаты"}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="rounded p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {chat ? (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {thread.length === 0 ? (
                    <p className="pt-4 text-center text-xs text-muted-foreground">Сообщений пока нет.</p>
                  ) : (
                    thread.map((m) => {
                      const mine = m.sender_id === meId;
                      return (
                        <div key={m.id} className={cn("group flex items-end gap-1", mine ? "justify-end" : "justify-start")}>
                          {isTutor ? (
                            <button
                              type="button"
                              onClick={() => remove(m.id)}
                              aria-label="Удалить сообщение"
                              className={cn("rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100", mine ? "order-first" : "order-last")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          <div className="max-w-[80%] space-y-0.5">
                            {!mine ? <span className="px-1 text-[10px] text-muted-foreground">{m.senderName}</span> : null}
                            <div className={cn("space-y-1 rounded-lg px-3 py-1.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                              {m.body ? <div className="whitespace-pre-wrap break-words">{m.body}</div> : null}
                              {m.attachment_url ? (
                                /\.(png|jpe?g|webp|gif)$/i.test(m.attachment_url) ? (
                                  <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={m.attachment_url} alt={m.attachment_name ?? ""} className="max-h-40 rounded" />
                                  </a>
                                ) : (
                                  <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all underline">
                                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                    {m.attachment_name ?? "файл"}
                                  </a>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="space-y-2 border-t p-2">
                  {attachment ? (
                    <div className="flex items-center gap-2 rounded bg-muted px-2 py-1 text-xs">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} aria-label="Убрать файл" className="rounded p-0.5 hover:bg-accent">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Прикрепить файл">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                    <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение группе…" className="h-9" />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || (text.trim() === "" && !attachment)} aria-label="Отправить">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {chats.length === 0 ? (
                  <p className="px-2 pt-6 text-center text-xs text-muted-foreground">Нет доступных групповых чатов.</p>
                ) : (
                  <ul className="space-y-1">
                    {chats.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => { setThread([]); setChat(c); }}
                          className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                        >
                          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{c.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
