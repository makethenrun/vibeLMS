"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import { feedbackClass } from "@/lib/materials/answer-check";
import type { AudioContent } from "@/lib/validators";
import type { Json } from "@/types";
import { SortableChips, type Chip } from "../dnd/sortable-chips";
import { ScoreBadge } from "../score-badge";
import { useSubmit } from "../use-submit";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A compact play/pause button for a single audio URL. */
function PlayButton({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => { ref.current?.pause(); }, []);

  function toggle(e: ReactMouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    let a = ref.current;
    if (!a) {
      a = new Audio(url);
      a.onended = () => setPlaying(false);
      ref.current = a;
    }
    if (a.paused) {
      a.currentTime = 0;
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm hover:bg-accent"
      aria-label={playing ? "Пауза" : "Играть"}
      title={playing ? "Пауза" : "Играть"}
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </button>
  );
}

interface Props {
  itemId: string;
  content: AudioContent;
  initialScore: number | null | undefined;
  initialAnswer?: { order?: string[] };
}

export function AudioMatchSolve({ itemId, content, initialScore, initialAnswer }: Props) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const pairs = useMemo(() => content.pairs.filter((p) => p.left.trim() !== "" && p.right.trim() !== ""), [content.pairs]);
  const isImage = content.variant === "MATCH_IMAGE";

  // Right chips (value = the pair's `right`). Restore the saved order when
  // locked; otherwise start shuffled.
  const [chips, setChips] = useState<Chip[]>(() => {
    const base = pairs.map((p, i) => ({ id: `p${i}`, label: p.right }));
    const saved = initialAnswer?.order;
    if (saved && saved.length === base.length) {
      const byValue = new Map(base.map((c) => [c.label, c] as const));
      const used = new Set<string>();
      const ordered: Chip[] = [];
      for (const v of saved) {
        const c = [...byValue.values()].find((x) => x.label === v && !used.has(x.id));
        if (c) { ordered.push(c); used.add(c.id); }
      }
      for (const c of base) if (!used.has(c.id)) ordered.push(c);
      return ordered;
    }
    return shuffle(base);
  });

  function chipNode(value: string): ReactNode {
    if (isImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={value} alt="" className="pointer-events-none h-14 max-w-[140px] rounded object-contain" />;
    }
    return <PlayButton url={value} />;
  }

  async function onSubmit() {
    await submit({ order: chips.map((c) => c.label) } as unknown as Json, content);
  }

  if (pairs.length === 0) return <p className="text-sm text-muted-foreground">Нет пар для сопоставления.</p>;

  const renderChips: Chip[] = chips.map((c) => ({ ...c, node: chipNode(c.label) }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {content.prompt || (isImage ? "Сопоставьте аудио с картинкой — перетащите в правильном порядке." : "Сопоставьте аудио — перетащите правую колонку в правильном порядке.")}
        </p>
        <ScoreBadge score={score} />
      </div>

      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4">
        {/* Left column: fixed audio (play buttons), one row per pair. */}
        <div className="flex flex-col gap-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex h-14 items-center gap-2 rounded-md border bg-background px-2">
              <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>
              <PlayButton url={p.left} />
            </div>
          ))}
        </div>

        {/* Right column: shuffled, draggable. Feedback colours when locked. */}
        <SortableChips
          chips={renderChips}
          onReorder={setChips}
          disabled={locked}
          vertical
          chipClass={(_chip, i) =>
            cn(
              "flex h-14 items-center justify-center",
              locked && feedbackClass(true, chips[i]?.label === pairs[i]?.right),
            )
          }
        />
      </div>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
