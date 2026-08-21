"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/types";
import type { Peer } from "@/services/messages/messages.service";
import { listPeersAction, openConversationAction, sendMessageAction, unreadCountAction } from "@/app/(app)/messages/actions";

export function Messenger() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  // Unread badge — poll always, so a closed messenger still lights up.
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

  const loadPeers = useCallback(async () => {
    const r = await listPeersAction();
    if (r.success) {
      setPeers(r.data.peers);
      setUnread(r.data.peers.reduce((s, p) => s + p.unread, 0));
    }
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

  // Peer list polling while open on the list.
  useEffect(() => {
    if (!open || peer) return;
    loadPeers();
    const id = setInterval(loadPeers, 5000);
    return () => clearInterval(id);
  }, [open, peer, loadPeers]);

  // Conversation polling while a peer is open.
  useEffect(() => {
    if (!open || !peer) return;
    loadThread(peer.id);
    const id = setInterval(() => loadThread(peer.id), 3000);
    return () => clearInterval(id);
  }, [open, peer, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  async function send() {
    if (!peer || text.trim() === "") return;
    setSending(true);
    const body = text;
    setText("");
    const r = await sendMessageAction(peer.id, body);
    setSending(false);
    if (r.success) setThread((prev) => [...prev, r.data.message]);
    else setText(body);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Сообщения"
        title="Сообщения"
        className="relative"
      >
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
          <div className="absolute right-0 top-11 z-50 flex h-[26rem] w-80 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              {peer ? (
                <button type="button" onClick={() => setPeer(null)} aria-label="Назад" className="rounded p-1 hover:bg-accent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <p className="flex-1 truncate text-sm font-semibold">{peer ? peer.login : "Сообщения"}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="rounded p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {peer ? (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {thread.length === 0 ? (
                    <p className="pt-4 text-center text-xs text-muted-foreground">Сообщений пока нет.</p>
                  ) : (
                    thread.map((m) => (
                      <div key={m.id} className={cn("flex", m.sender_id === meId ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-1.5 text-sm",
                            m.sender_id === meId ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          {m.body}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
                <form
                  className="flex items-center gap-2 border-t p-2"
                  onSubmit={(e) => { e.preventDefault(); void send(); }}
                >
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Сообщение…"
                    className="h-9"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || text.trim() === ""} aria-label="Отправить">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {peers.length === 0 ? (
                  <p className="pt-4 text-center text-xs text-muted-foreground">Нет собеседников.</p>
                ) : (
                  <ul className="space-y-1">
                    {peers.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => { setThread([]); setPeer(p); }}
                          className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="truncate">{p.login}</span>
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
