"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { FormattedText } from "@/components/shared/formatted-text";
import { ImageZoom } from "@/components/shared/image-zoom";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { feedbackClass, isCorrect } from "@/lib/materials/answer-check";
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

// Fixed 200×200 rounded square (per design).
const IMG = "h-[200px] w-[200px] rounded-2xl border object-cover";
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
  const prompt = content.prompt ? <p className="text-sm"><FormattedText text={content.prompt} /></p> : null;

  const selectOptions = useMemo(() => shuffle([...content.pairs.map((p) => p.word), ...content.distractors]), [content.pairs, content.distractors]);

  // DRAG_WORD_TO_IMAGE: word chips → image slots.
  const wordChips = useMemo<Chip[]>(() => shuffle(content.pairs.map((p, i) => ({ id: `w${i}`, label: p.word }))), [content.pairs]);
  // DRAG_IMAGE_TO_WORD: image chips → word slots.
  const imageChips = useMemo<Chip[]>(
    () => shuffle(content.pairs.map((p, i) => ({ id: `img${i}`, label: p.word, node: emojiImg(p.imageUrl) }))),
    [content.pairs],
  );

  const wordLabel = new Map(wordChips.map((c) => [c.id, c.label]));
  const imageLabel = new Map(imageChips.map((c) => [c.id, c.label]));

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
        <div className="flex flex-wrap justify-center gap-4">
          {content.images.map((img, i) => {
            const on = selected.includes(i);
            const border = !on
              ? "border-transparent"
              : locked
                ? img.correct ? "border-green-500" : "border-red-500"
                : "border-primary";
            return (
              <button key={i} type="button" disabled={locked}
                onClick={() => setSelected((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i]))}
                className={cn("relative rounded-2xl border-4", border)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="" className={IMG} />
                <ImageZoom src={img.imageUrl} />
              </button>
            );
          })}
        </div>
      ) : content.variant === "DRAG_WORD_TO_IMAGE" ? (
        <FillDnd chips={wordChips} value={dragValue} onChange={setDragValue} disabled={locked}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-6">
              {content.pairs.map((p, i) => (
                <DropSlot key={i} id={`p${i}`} className={cn("flex w-[200px] flex-col items-center gap-2 rounded-2xl border p-2", feedbackClass(locked, isCorrect(wordLabel.get(dragValue[`p${i}`] ?? ""), [p.word])))}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt="" className="h-[200px] w-full rounded-xl object-cover" />
                  <ImageZoom src={p.imageUrl} />
                </DropSlot>
              ))}
            </div>
            <Bank chipClassName="min-w-20 justify-center px-4 py-3 text-base font-semibold" />
          </div>
        </FillDnd>
      ) : content.variant === "DRAG_IMAGE_TO_WORD" ? (
        <FillDnd chips={imageChips} value={dragValue} onChange={setDragValue} disabled={locked}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              {content.pairs.map((p, k) => (
                <DropSlot key={k} id={`l${k}`} className={cn("flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-base font-semibold", feedbackClass(locked, isCorrect(imageLabel.get(dragValue[`l${k}`] ?? ""), [p.word])))}>
                  <span><FormattedText text={p.word} /></span>
                </DropSlot>
              ))}
            </div>
            <Bank chipClassName="h-20 w-20 overflow-hidden border p-0 sm:h-24 sm:w-24" />
          </div>
        </FillDnd>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {content.pairs.map((p, i) => (
            <div key={i} className="flex w-[200px] flex-col items-stretch gap-2">
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt="" className={IMG} />
                <ImageZoom src={p.imageUrl} />
              </span>
              {content.variant === "SELECT_WORD" ? (
                <Select value={pairAns[String(i)] ?? ""} onValueChange={(v) => setPairAns((prev) => ({ ...prev, [String(i)]: v }))} disabled={locked}>
                  <SelectTrigger className={cn("w-full", feedbackClass(locked, isCorrect(pairAns[String(i)], [p.word])))}><SelectValue placeholder="Выберите слово" /></SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input disabled={locked} placeholder="Слово" value={pairAns[String(i)] ?? ""} onChange={(e) => setPairAns((prev) => ({ ...prev, [String(i)]: e.target.value }))} className={cn("w-full text-center", feedbackClass(locked, isCorrect(pairAns[String(i)], [p.word])))} />
              )}
            </div>
          ))}
        </div>
      )}

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
