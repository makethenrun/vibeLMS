"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ImageTaskContent } from "@/lib/validators";
import type { Json } from "@/types";
import { assignByLabel, Bank, DropSlot, FillDnd } from "../dnd/fill";
import type { Chip } from "../dnd/sortable-chips";
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

// 300×300 rounded square (per design).
const IMG = "aspect-square w-full max-w-[300px] rounded-2xl border object-cover";
const FRAME = "aspect-square w-full max-w-[300px] flex-col gap-2 rounded-2xl border text-lg font-semibold";
// eslint-disable-next-line @next/next/no-img-element
const emojiImg = (url: string) => <img src={url} alt="" className="h-full w-full rounded-2xl object-cover" />;

interface Props {
  itemId: string;
  content: ImageTaskContent;
  initialScore: number | null | undefined;
  initialAnswer?: { selected?: number[]; pairs?: Record<string, string> };
}

export function ImageTaskSolve({ itemId, content, initialScore, initialAnswer }: Props) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const prompt = content.prompt ? <p className="text-sm">{content.prompt}</p> : null;

  const selectOptions = useMemo(() => shuffle([...content.pairs.map((p) => p.word), ...content.distractors]), [content.pairs, content.distractors]);

  // DRAG_WORD_TO_IMAGE: word chips → image slots.
  const wordChips = useMemo<Chip[]>(() => shuffle(content.pairs.map((p, i) => ({ id: `w${i}`, label: p.word }))), [content.pairs]);
  // DRAG_IMAGE_TO_WORD: image chips → word slots.
  const imageChips = useMemo<Chip[]>(
    () => shuffle(content.pairs.map((p, i) => ({ id: `img${i}`, label: p.word, node: emojiImg(p.imageUrl) }))),
    [content.pairs],
  );

  const [selected, setSelected] = useState<number[]>(initialAnswer?.selected ?? []);
  const [pairAns, setPairAns] = useState<Record<string, string>>(initialAnswer?.pairs ?? {});
  const [dragValue, setDragValue] = useState<Record<string, string>>(() => {
    const ans = initialAnswer?.pairs;
    if (!ans) return {};
    if (content.variant === "DRAG_WORD_TO_IMAGE") {
      return assignByLabel(content.pairs.map((_, i) => ({ slotId: `p${i}`, label: ans[String(i)] ?? "" })), wordChips);
    }
    if (content.variant === "DRAG_IMAGE_TO_WORD") {
      const value: Record<string, string> = {};
      const usedSlots = new Set<string>();
      for (let j = 0; j < content.pairs.length; j++) {
        const word = ans[String(j)];
        if (!word) continue;
        const k = content.pairs.findIndex((p, idx) => !usedSlots.has(`l${idx}`) && p.word === word);
        if (k !== -1) { value[`l${k}`] = `img${j}`; usedSlots.add(`l${k}`); }
      }
      return value;
    }
    return {};
  });

  async function onSubmit() {
    if (content.variant === "SELECT_IMAGES") {
      await submit({ selected } as unknown as Json, content);
      return;
    }
    if (content.variant === "DRAG_WORD_TO_IMAGE") {
      const label = new Map(wordChips.map((c) => [c.id, c.label]));
      const pairs: Record<string, string> = {};
      content.pairs.forEach((_, i) => {
        const chipId = dragValue[`p${i}`];
        pairs[String(i)] = chipId ? label.get(chipId) ?? "" : "";
      });
      await submit({ pairs } as unknown as Json, content);
      return;
    }
    if (content.variant === "DRAG_IMAGE_TO_WORD") {
      const pairs: Record<string, string> = {};
      content.pairs.forEach((wp, k) => {
        const chipId = dragValue[`l${k}`]; // img${j}
        if (chipId) pairs[chipId.replace("img", "")] = wp.word;
      });
      await submit({ pairs } as unknown as Json, content);
      return;
    }
    await submit({ pairs: pairAns } as unknown as Json, content);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {prompt ?? <span />}
        <ScoreBadge score={score} />
      </div>

      {content.variant === "SELECT_IMAGES" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {content.images.map((img, i) => {
            const on = selected.includes(i);
            return (
              <button key={i} type="button" disabled={locked}
                onClick={() => setSelected((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i]))}
                className={cn("rounded-2xl border-4", on ? "border-primary" : "border-transparent")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="" className={IMG} />
              </button>
            );
          })}
        </div>
      ) : content.variant === "DRAG_WORD_TO_IMAGE" ? (
        <FillDnd chips={wordChips} value={dragValue} onChange={setDragValue} disabled={locked}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              {content.pairs.map((p, i) => (
                <DropSlot key={i} id={`p${i}`} className="flex w-full max-w-[300px] flex-col items-center gap-2 rounded-2xl border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt="" className="aspect-square w-full rounded-xl object-cover" />
                </DropSlot>
              ))}
            </div>
            <Bank className="h-fit flex-col items-stretch gap-4 border-none p-0" chipClassName={`flex items-center justify-center ${FRAME}`} />
          </div>
        </FillDnd>
      ) : content.variant === "DRAG_IMAGE_TO_WORD" ? (
        <FillDnd chips={imageChips} value={dragValue} onChange={setDragValue} disabled={locked}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              {content.pairs.map((p, k) => (
                <DropSlot key={k} id={`l${k}`} className={`flex items-center justify-center ${FRAME}`}>
                  <span>{p.word}</span>
                </DropSlot>
              ))}
            </div>
            <Bank className="h-fit flex-col items-stretch gap-4 border-none p-0" chipClassName={`overflow-hidden border p-0 ${IMG.replace("object-cover", "")}`} />
          </div>
        </FillDnd>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {content.pairs.map((p, i) => (
            <div key={i} className="flex w-full max-w-[300px] flex-col items-stretch gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt="" className={IMG} />
              {content.variant === "SELECT_WORD" ? (
                <Select value={pairAns[String(i)] ?? ""} onValueChange={(v) => setPairAns((prev) => ({ ...prev, [String(i)]: v }))} disabled={locked}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Выберите слово" /></SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input disabled={locked} placeholder="Слово" value={pairAns[String(i)] ?? ""} onChange={(e) => setPairAns((prev) => ({ ...prev, [String(i)]: e.target.value }))} className="w-full text-center" />
              )}
            </div>
          ))}
        </div>
      )}

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
