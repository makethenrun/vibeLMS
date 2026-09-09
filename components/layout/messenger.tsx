"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Loader2, MessageCircle, Paperclip, Plus, Search, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db/database.types";
import type { MessageRow } from "@/types";
import type { Peer } from "@/services/messages/messages.service";
import {
  deleteMessageAction,
  listConversationsAction,
  listPeersAction,
  openConversationAction,
  sendMessageAction,
  unreadCountAction,
} from "@/app/(app)/messages/actions";

export function Messenger({ role }: { role: UserRole }) {
  const isTutor = role === "TUTOR";
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [unread, setUnread] = useState(0);
  const [conversations, setConversations] = useState<Peer[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const r = await unreadCountAction();
      if (alive && r.success) setUnread(r.data.count);
    }
    tick();
    const id = setInterval(tick, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const loadConversations = useCallback(async () => {
    const r = await listConversationsAction();
    if (r.success) {
      setConversations(r.data.peers);
      setUnread(r.data.peers.reduce((s, p) => s + p.unread, 0));
    }
  }, []);

  const loadPeers = useCallback(async () => {
    const r = await listPeersAction();
    if (r.success) setPeers(r.data.peers);
  }, []);

  const loadThread = useCallback(async (peerId: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await openConversationAction(peerId);
      if (r.success) {
        setThread(r.data.messages);
        setMeId(r.data.meId);
      }
    } finally {
      busy.current = false;
    }
  }, []);

  // Conversation list (default view) refreshes while open.
  useEffect(() => {
    if (!open || peer || searching) return;
    loadConversations();
    const id = setInterval(loadConversations, 5000);
    return () => clearInterval(id);
  }, [open, peer, searching, loadConversations]);

  // Full peer list is loaded once when the user opens search.
  useEffect(() => {
    if (searching) loadPeers();
  }, [searching, loadPeers]);

  useEffect(() => {
    if (!open || !peer) return;
    loadThread(peer.id);
    const id = setInterval(() => loadThread(peer.id), 3000);
    return () => clearInterval(id);
  }, [open, peer, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const filteredPeers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? peers.filter((p) => p.name.toLowerCase().includes(q)) : peers;
  }, [peers, query]);

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
    if (!peer || (text.trim() === "" && !attachment)) return;
    setSending(true);
    const body = text;
    const att = attachment;
    setText("");
    setAttachment(null);
    const r = await sendMessageAction(peer.id, body, att?.url ?? null, att?.name ?? null);
    setSending(false);
    if (r.success) setThread((prev) => [...prev, r.data.message]);
    else { setText(body); setAttachment(att); }
  }

  async function remove(id: string) {
    setThread((prev) => prev.filter((m) => m.id !== id));
    await deleteMessageAction(id);
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Сообщения" title="Сообщения" className="relative">
        <MessageCircle className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              {peer ? (
                <button type="button" onClick={() => setPeer(null)} aria-label="Назад" className="rounded p-1 hover:bg-accent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : searching ? (
                <button type="button" onClick={() => { setSearching(false); setQuery(""); }} aria-label="Назад" className="rounded p-1 hover:bg-accent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <p className="flex-1 truncate text-sm font-semibold">{peer ? peer.name : searching ? "Новый чат" : "Сообщения"}</p>
              {!peer && !searching ? (
                <button type="button" onClick={() => setSearching(true)} aria-label="Новый чат" title="Новый чат" className="rounded p-1 hover:bg-accent">
                  <Plus className="h-4 w-4" />
                </button>
              ) : null}
              <button type="button" onClick={() => { setOpen(false); setSearching(false); setQuery(""); }} aria-label="Закрыть" className="rounded p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {peer ? (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {thread.length === 0 ? (
                    <p className="pt-4 text-center text-xs text-muted-foreground">Сообщений пока нет.</p>
                  ) : (
                    thread.map((m) => {
                      const mine = m.sender_id === meId;
                      return (
                        <div key={m.id} className={cn("group flex items-center gap-1", mine ? "justify-end" : "justify-start")}>
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
                          <div className={cn("max-w-[80%] space-y-1 rounded-lg px-3 py-1.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
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
                    <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение…" className="h-9" />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || (text.trim() === "" && !attachment)} aria-label="Отправить">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : searching ? (
              <>
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск пользователя…" className="h-8 pl-8" autoFocus />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {filteredPeers.length === 0 ? (
                    <p className="pt-4 text-center text-xs text-muted-foreground">Никого не найдено.</p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredPeers.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => { setThread([]); setPeer(p); setSearching(false); setQuery(""); }}
                            className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span className="truncate">{p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <p className="px-2 pt-6 text-center text-xs text-muted-foreground">Пока нет диалогов. Нажмите «+», чтобы начать переписку.</p>
                ) : (
                  <ul className="space-y-1">
                    {conversations.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => { setThread([]); setPeer(p); }}
                          className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="truncate">{p.name}</span>
                          {p.unread > 0 ? (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                              {p.unread}
                            </span>
                          ) : null}
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
