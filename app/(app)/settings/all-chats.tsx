"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, MessagesSquare, Paperclip, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/types";
import type { ConversationSummary } from "@/services/messages/messages.service";
import { listAllConversationsAction, readConversationAction } from "@/app/(app)/messages/actions";

export function AllChats() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<ConversationSummary | null>(null);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    listAllConversationsAction().then((r) => {
      if (alive && r.success) setConversations(r.data.conversations);
    });
    return () => { alive = false; };
  }, []);

  async function openPair(c: ConversationSummary) {
    setActive(c);
    setLoading(true);
    const r = await readConversationAction(c.aId, c.bId);
    setLoading(false);
    if (r.success) setThread(r.data.messages);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? conversations.filter((c) => c.aName.toLowerCase().includes(q) || c.bName.toLowerCase().includes(q))
    : conversations;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessagesSquare className="h-4 w-4" />
          Переписки
        </CardTitle>
        <p className="text-xs text-muted-foreground">Просмотр любой переписки в системе (только чтение).</p>
      </CardHeader>
      <CardContent>
        {active ? (
          <div className="space-y-3">
            <button type="button" onClick={() => setActive(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Все переписки
            </button>
            <p className="text-sm font-medium">{active.aName} ↔ {active.bName}</p>
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border p-3">
              {loading ? (
                <p className="text-center text-xs text-muted-foreground">Загрузка…</p>
              ) : thread.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">Сообщений нет.</p>
              ) : (
                thread.map((m) => {
                  const fromA = m.sender_id === active.aId;
                  return (
                    <div key={m.id} className={cn("flex flex-col", fromA ? "items-start" : "items-end")}>
                      <span className="px-1 text-[10px] text-muted-foreground">{fromA ? active.aName : active.bName}</span>
                      <div className={cn("max-w-[80%] space-y-1 rounded-lg px-3 py-1.5 text-sm", fromA ? "bg-muted" : "bg-primary text-primary-foreground")}>
                        {m.body ? <div className="whitespace-pre-wrap break-words">{m.body}</div> : null}
                        {m.attachment_url ? (
                          <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all underline">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            {m.attachment_name ?? "файл"}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по участникам" className="pl-8" />
            </div>
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Переписок нет.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {filtered.map((c) => (
                  <li key={`${c.aId}|${c.bId}`}>
                    <button type="button" onClick={() => openPair(c)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent">
                      <span className="truncate">{c.aName} ↔ {c.bName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
