"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pin, StickyNote, Trash2 } from "lucide-react";
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
  ImageTaskContent,
  InfoContent,
  ItemContent,
  LinkContent,
  MatchContent,
  QuizContent,
  VideoContent,
} from "@/lib/validators";
import type { Group, ItemRow, MaterialItemType } from "@/types";
import { deleteItemAction, moveItemAction, setItemPinsAction, updateItemAction, updateItemMetaAction } from "../actions";
import { AudioEditor } from "./item-editors/audio-editor";
import { CarouselEditor } from "./item-editors/carousel-editor";
import { FreeEditor } from "./item-editors/free-editor";
import { GapsEditor } from "./item-editors/gaps-editor";
import { ImageEditor } from "./item-editors/image-editor";
import { ImageTaskEditor } from "./item-editors/image-task-editor";
import { InfoEditor } from "./item-editors/info-editor";
import { LinkEditor } from "./item-editors/link-editor";
import { MatchEditor } from "./item-editors/match-editor";
import { QuizEditor } from "./item-editors/quiz-editor";
import { VideoEditor } from "./item-editors/video-editor";

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
};

interface ItemCardProps {
  item: ItemRow;
  canUp: boolean;
  canDown: boolean;
  availableGroups: Group[];
  pinnedGroupIds: string[];
  selected: boolean;
  onToggleSelect: () => void;
}

export function ItemCard({
  item,
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
  const [noteOpen, setNoteOpen] = useState(Boolean(item.note));
  const [pins, setPins] = useState<string[]>(pinnedGroupIds);

  const onSave = async (content: ItemContent) => {
    const result = await updateItemAction(item.id, content);
    if (result.success) {
      toast.success("Сохранено");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  async function saveMeta(next?: { title?: string; note?: string; noteHidden?: boolean }) {
    const result = await updateItemMetaAction(item.id, {
      title: next?.title ?? title,
      note: next?.note ?? note,
      noteHidden: next?.noteHidden ?? noteHidden,
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
      case "GAPS":
        return <GapsEditor content={item.content as unknown as GapsContent} onSave={onSave} />;
      case "FREE":
        return <FreeEditor content={item.content as unknown as FreeContent} onSave={onSave} />;
      case "MATCH":
        return <MatchEditor content={item.content as unknown as MatchContent} onSave={onSave} />;
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
            aria-label="Заметка">
            <StickyNote className={note ? "h-4 w-4 text-primary" : "h-4 w-4"} />
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
      </CardHeader>
      <CardContent className="pt-4">{renderEditor()}</CardContent>
    </Card>
  );
}
