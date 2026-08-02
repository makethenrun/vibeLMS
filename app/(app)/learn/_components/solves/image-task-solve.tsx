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
import { AssignBoard } from "../dnd/assign-board";
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

interface Props {
  itemId: string;
  content: ImageTaskContent;
  initialScore: number | null | undefined;
}

export function ImageTaskSolve({ itemId, content, initialScore }: Props) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const prompt = content.prompt ? <p className="text-sm">{content.prompt}</p> : null;

  // SELECT_IMAGES — click to toggle correct images.
  const [selected, setSelected] = useState<number[]>([]);
  // TYPE_WORD / SELECT_WORD / drag — pair index → assigned word.
  const [pairAns, setPairAns] = useState<Record<string, string>>({});
  // Drag variants use AssignBoard: slot id `p${i}` → word chip id.
  const wordChips = useMemo<Chip[]>(() => shuffle(content.pairs.map((p, i) => ({ id: `w${i}`, label: p.word }))), [content.pairs]);
  const [dragValue, setDragValue] = useState<Record<string, string>>({});

  const selectOptions = useMemo(
    () => shuffle([...content.pairs.map((p) => p.word), ...content.distractors]),
    [content.pairs, content.distractors],
  );

  async function onSubmit() {
    if (content.variant === "SELECT_IMAGES") {
      await submit({ selected } as unknown as Json);
      return;
    }
    if (content.variant === "DRAG_IMAGE_TO_WORD" || content.variant === "DRAG_WORD_TO_IMAGE") {
      const chipLabel = new Map(wordChips.map((c) => [c.id, c.label]));
      const pairs: Record<string, string> = {};
      content.pairs.forEach((_, i) => {
        const chipId = dragValue[`p${i}`];
        pairs[String(i)] = chipId ? chipLabel.get(chipId) ?? "" : "";
      });
      await submit({ pairs } as unknown as Json);
      return;
    }
    await submit({ pairs: pairAns } as unknown as Json);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {prompt ?? <span />}
        <ScoreBadge score={score} />
      </div>

      {content.variant === "SELECT_IMAGES" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {content.images.map((img, i) => {
            const on = selected.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => setSelected((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i]))}
                className={cn("overflow-hidden rounded-lg border-2", on ? "border-primary" : "border-transparent")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="" className="h-28 w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : content.variant === "DRAG_IMAGE_TO_WORD" || content.variant === "DRAG_WORD_TO_IMAGE" ? (
        <AssignBoard
          chips={wordChips}
          slots={content.pairs.map((p, i) => ({
            id: `p${i}`,
            // eslint-disable-next-line @next/next/no-img-element
            node: <img src={p.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />,
          }))}
          value={dragValue}
          onChange={setDragValue}
          disabled={locked}
        />
      ) : (
        <div className="space-y-3">
          {content.pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
              {content.variant === "SELECT_WORD" ? (
                <Select
                  value={pairAns[String(i)] ?? ""}
                  onValueChange={(v) => setPairAns((prev) => ({ ...prev, [String(i)]: v }))}
                  disabled={locked}
                >
                  <SelectTrigger className="w-56"><SelectValue placeholder="Выберите слово" /></SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  disabled={locked}
                  placeholder="Слово"
                  value={pairAns[String(i)] ?? ""}
                  onChange={(e) => setPairAns((prev) => ({ ...prev, [String(i)]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
