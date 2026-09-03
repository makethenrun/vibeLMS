"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookA, Brush, ChevronDown, ChevronUp, Pin, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  AudioContent,
  CarouselContent,
  FreeContent,
  GapsContent,
  ImageContent,
  CardsContent,
  ImageTaskContent,
  InfoContent,
  ItemContent,
  LinkContent,
  MatchContent,
  QuizContent,
  SentenceTaskContent,
  VideoContent,
} from "@/lib/validators";
import type { Group, ItemRow, MaterialItemType } from "@/types";
import { ITEM_FONTS, ITEM_SIZES, itemTextStyle } from "@/lib/materials/text-style";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { deleteItemAction, moveItemAction, setItemDrawingAction, setItemPinsAction, updateItemAction, updateItemMetaAction } from "../actions";
import { AudioEditor } from "./item-editors/audio-editor";
import { CardsEditor } from "./item-editors/cards-editor";
import { CarouselEditor } from "./item-editors/carousel-editor";
import { FreeEditor } from "./item-editors/free-editor";
import { GapsEditor } from "./item-editors/gaps-editor";
import { ImageEditor } from "./item-editors/image-editor";
import { ImageTaskEditor } from "./item-editors/image-task-editor";
import { InfoEditor } from "./item-editors/info-editor";
import { LinkEditor } from "./item-editors/link-editor";
import { MatchEditor } from "./item-editors/match-editor";
import { QuizEditor } from "./item-editors/quiz-editor";
import { SentenceTaskEditor } from "./item-editors/sentence-task-editor";
import { VideoEditor } from "./item-editors/video-editor";

const SOLVABLE_TYPES: MaterialItemType[] = ["QUIZ", "GAPS", "FREE", "MATCH", "IMAGE_TASK", "SENTENCE_TASK", "CARDS"];

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Обучающая информация",
  QUIZ: "Тест",
  GAPS: "Заполнить пропуски",
  FREE: "Свободный ответ",
  MATCH: "Сопоставление пар",
  AUDIO: "Аудио",
  VIDEO: "Видео",
  IMAGE: "Изображение",
  CAROUSEL: "Карусель изображений",
  LINK: "Ссылка",
  IMAGE_TASK: "Упражнение с изображениями",
  SENTENCE_TASK: "Работа с предложениями",
  CARDS: "Случайные карточки",
};

interface ItemCardProps {
  item: ItemRow;
  number: string | null;
  canUp: boolean;
  canDown: boolean;
  availableGroups: Group[];
  pinnedGroupIds: string[];
  selected: boolean;
  onToggleSelect: () => void;
}

export function ItemCard({
  item,
  number,
  canUp,
  canDown,
  availableGroups,
  pinnedGroupIds,
  selected,
  onToggleSelect,
}: ItemCardProps) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title ?? "");
  const [note, setNote] = useState(item.note ?? "");
  const [noteHidden, setNoteHidden] = useState(item.note_hidden);
  const [retryDisabled, setRetryDisabled] = useState(item.retry_disabled);
  const [fontFamily, setFontFamily] = useState<string | null>(item.font_family);
  const [fontSize, setFontSize] = useState<string | null>(item.font_size);
  const [explanation, setExplanation] = useState(item.explanation ?? "");
  const [vocab, setVocab] = useState<{ term: string; translation: string }[]>(
    Array.isArray(item.vocab) ? (item.vocab as { term: string; translation: string }[]) : [],
  );
  const [unnumbered, setUnnumbered] = useState(item.unnumbered);
  const [noteOpen, setNoteOpen] = useState(Boolean(item.note));
  const [vocabOpen, setVocabOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [pins, setPins] = useState<string[]>(pinnedGroupIds);

  const saveDrawing = async (dataUrl: string | null) => {
    const result = await setItemDrawingAction(item.id, dataUrl);
    if (result.success) {
      toast.success(dataUrl ? "Рисунок сохранён" : "Рисунок удалён");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const onSave = async (content: ItemContent) => {
    const result = await updateItemAction(item.id, content);
    if (result.success) {
      toast.success("Сохранено");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  async function saveMeta(next?: {
    title?: string;
    note?: string;
    noteHidden?: boolean;
    retryDisabled?: boolean;
    fontFamily?: string | null;
    fontSize?: string | null;
    explanation?: string;
    vocab?: { term: string; translation: string }[];
    unnumbered?: boolean;
  }) {
    const result = await updateItemMetaAction(item.id, {
      title: next?.title ?? title,
      note: next?.note ?? note,
      noteHidden: next?.noteHidden ?? noteHidden,
      retryDisabled: next?.retryDisabled ?? retryDisabled,
      fontFamily: next?.fontFamily !== undefined ? next.fontFamily : fontFamily,
      fontSize: next?.fontSize !== undefined ? next.fontSize : fontSize,
      explanation: next?.explanation ?? explanation,
      vocab: next?.vocab ?? vocab,
      unnumbered: next?.unnumbered ?? unnumbered,
    });
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  async function togglePin(groupId: string) {
    const nextPins = pins.includes(groupId) ? pins.filter((g) => g !== groupId) : [...pins, groupId];
    setPins(nextPins);
    const result = await setItemPinsAction(item.id, nextPins);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  async function move(direction: "up" | "down") {
    const result = await moveItemAction(item.id, direction);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  function renderEditor() {
    switch (item.type) {
      case "INFO":
        return <InfoEditor content={item.content as unknown as InfoContent} onSave={onSave} />;
      case "QUIZ":
        return <QuizEditor content={item.content as unknown as QuizContent} onSave={onSave} />;
      case "AUDIO":
        return <AudioEditor content={item.content as unknown as AudioContent} onSave={onSave} />;
      case "VIDEO":
        return <VideoEditor content={item.content as unknown as VideoContent} onSave={onSave} />;
      case "IMAGE":
        return <ImageEditor content={item.content as unknown as ImageContent} onSave={onSave} />;
      case "CAROUSEL":
        return <CarouselEditor content={item.content as unknown as CarouselContent} onSave={onSave} />;
      case "LINK":
        return <LinkEditor content={item.content as unknown as LinkContent} onSave={onSave} />;
      case "IMAGE_TASK":
        return <ImageTaskEditor content={item.content as unknown as ImageTaskContent} onSave={onSave} />;
      case "SENTENCE_TASK":
        return <SentenceTaskEditor content={item.content as unknown as SentenceTaskContent} onSave={onSave} />;
      case "GAPS":
        return <GapsEditor content={item.content as unknown as GapsContent} onSave={onSave} />;
      case "FREE":
        return <FreeEditor content={item.content as unknown as FreeContent} onSave={onSave} />;
      case "MATCH":
        return <MatchEditor content={item.content as unknown as MatchContent} onSave={onSave} />;
      case "CARDS":
        return <CardsEditor content={item.content as unknown as CardsContent} onSave={onSave} />;
      default:
        return null;
    }
  }

  const pinnedNames = availableGroups.filter((g) => pins.includes(g.id)).map((g) => g.name);

  return (
    <Card id={`item-${item.id}`} className="scroll-mt-20">
      <CardHeader className="space-y-2 border-b py-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label="Выбрать для импорта"
          />
          {number ? (
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary" title="Номер упражнения">
              {number}
            </span>
          ) : null}
          <Input
            value={title}
            placeholder={`(${TYPE_LABELS[item.type]})`}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => saveMeta({ title })}
            className="h-8 flex-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon" variant="ghost"
                className={pins.length > 0 ? "h-8 w-8 text-primary" : "h-8 w-8"}
                aria-label="Закрепить для групп"
              >
                <Pin className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Закрепить для групп</DropdownMenuLabel>
              {availableGroups.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Сначала откройте доступ группам у материала.
                </p>
              ) : (
                availableGroups.map((g) => (
                  <label key={g.id} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent">
                    <input type="checkbox" checked={pins.includes(g.id)} onChange={() => togglePin(g.id)} />
                    {g.name}
                  </label>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setNoteOpen((o) => !o)}
            aria-label="Заметка" title={note || "Заметка"}>
            <StickyNote className={note ? "h-4 w-4 text-primary" : "h-4 w-4"} />
          </Button>
          <Button size="icon" variant="ghost" className={vocab.length > 0 ? "h-8 w-8 text-primary" : "h-8 w-8"}
            onClick={() => setVocabOpen((o) => !o)} aria-label="Новые слова" title="Новые слова">
            <BookA className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={drawMode || item.drawing ? "h-8 w-8 text-primary" : "h-8 w-8"}
            onClick={() => setDrawMode((d) => !d)}
            aria-label="Рисование"
            title="Рисовать поверх задания (как видит ученик)"
          >
            <Brush className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!canUp}
            onClick={() => move("up")} aria-label="Вверх">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!canDown}
            onClick={() => move("down")} aria-label="Вниз">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Удалить элемент?"
            description="Элемент будет удалён без возможности восстановления."
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Элемент удалён"
            action={() => deleteItemAction(item.id)}
          />
        </div>

        {pinnedNames.length > 0 ? (
          <p className="text-xs text-primary">Закреплено: {pinnedNames.join(", ")}</p>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={unnumbered}
            onChange={(e) => {
              setUnnumbered(e.target.checked);
              void saveMeta({ unnumbered: e.target.checked });
            }}
          />
          Без номера (номер перейдёт следующему)
        </label>

        {SOLVABLE_TYPES.includes(item.type) ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={retryDisabled}
              onChange={(e) => {
                setRetryDisabled(e.target.checked);
                void saveMeta({ retryDisabled: e.target.checked });
              }}
            />
            Запретить повторное прохождение
          </label>
        ) : null}

        {SOLVABLE_TYPES.includes(item.type) ? (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Пояснение при неверном ответе (необязательно)</label>
            <Textarea
              rows={2}
              placeholder="Показывается ученику, если он ответил неверно…"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              onBlur={() => saveMeta({ explanation })}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Оформление:</span>
          <select
            className="h-7 rounded-md border bg-background px-1"
            value={fontFamily ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setFontFamily(v);
              void saveMeta({ fontFamily: v });
            }}
          >
            {ITEM_FONTS.map((f) => (
              <option key={f.label} value={f.value ?? ""}>{f.label}</option>
            ))}
          </select>
          <select
            className="h-7 rounded-md border bg-background px-1"
            value={fontSize ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setFontSize(v);
              void saveMeta({ fontSize: v });
            }}
          >
            {ITEM_SIZES.map((s) => (
              <option key={s.label} value={s.value ?? ""}>{s.label}</option>
            ))}
          </select>
        </div>

        {noteOpen ? (
          <div className="space-y-2 rounded-md bg-muted/40 p-2">
            <Textarea
              rows={2}
              placeholder="Заметка к упражнению…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={noteHidden}
                  onChange={(e) => {
                    setNoteHidden(e.target.checked);
                    void saveMeta({ noteHidden: e.target.checked });
                  }}
                />
                Скрыть от ученика
              </label>
              <Button size="sm" variant="outline" onClick={() => saveMeta({ note })}>
                Сохранить заметку
              </Button>
            </div>
          </div>
        ) : null}

        {vocabOpen ? (
          <div className="space-y-2 rounded-md bg-green-50/60 p-2">
            <p className="text-xs font-medium text-muted-foreground">Новые слова (показываются ученику рядом с упражнением)</p>
            {vocab.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="h-8"
                  placeholder="слово"
                  value={v.term}
                  onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, term: e.target.value } : x)))}
                  onBlur={() => saveMeta({ vocab })}
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  className="h-8"
                  placeholder="перевод"
                  value={v.translation}
                  onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, translation: e.target.value } : x)))}
                  onBlur={() => saveMeta({ vocab })}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Удалить слово"
                  onClick={() => { const next = vocab.filter((_, j) => j !== i); setVocab(next); void saveMeta({ vocab: next }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setVocab((prev) => [...prev, { term: "", translation: "" }])}>
              <Plus className="h-4 w-4" />
              Слово
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4" style={drawMode ? undefined : itemTextStyle(fontFamily, fontSize)}>
        {drawMode ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Вид как у ученика. Рисуйте поверх задания и сохраните кнопкой <span className="font-medium">✓</span> в панели рисования.
            </p>
            <PreviewProvider>
              <StudentItem item={item} saveDrawing={saveDrawing} />
            </PreviewProvider>
          </div>
        ) : (
          renderEditor()
        )}
      </CardContent>
    </Card>
  );
}
