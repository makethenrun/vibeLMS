"use client";

import { useContext, useEffect, useState } from "react";
import { ExternalLink, Lightbulb, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/app/(app)/materials/_components/media/audio-player";
import { Carousel } from "@/app/(app)/materials/_components/media/carousel";
import { VideoEmbed } from "@/app/(app)/materials/_components/media/video-embed";
import type {
  AudioContent,
  CarouselContent,
  FreeContent,
  GapsContent,
  ImageContent,
  ImageTaskContent,
  InfoContent,
  LinkContent,
  MatchContent,
  QuizContent,
  SentenceTaskContent,
  VideoContent,
} from "@/lib/validators";
import type { ItemRow, ItemSubmissionRow, MaterialItemType } from "@/types";
import { FormattedText } from "@/components/shared/formatted-text";
import { getMatchTable } from "@/lib/validators";
import { itemTextStyle } from "@/lib/materials/text-style";
import { DrawableBlock } from "./drawable-block";
import { FreeSolve } from "./free-solve";
import { GapsSolve } from "./gaps-solve";
import { ImageAnnotate } from "./image-annotate";
import { InfoView } from "./info-view";
import { QuizSolve } from "./quiz-solve";
import { GapsDragSolve } from "./solves/gaps-drag-solve";
import { ImageTaskSolve } from "./solves/image-task-solve";
import { MatchColumnsSolve } from "./solves/match-columns-solve";
import { SentenceSolve } from "./solves/sentence-solve";
import { ReviewContext } from "./submit-context";

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
};

const NOT_YET_INTERACTIVE = "Интерактивное прохождение этого формата появится в следующем обновлении.";

interface SavedAnswer {
  questions?: { selected: string[]; text: string }[];
  blanks?: Record<string, string>;
  order?: string[];
  letters?: string[];
  assign?: Record<string, number>;
  match?: Record<string, string>;
  selected?: number[];
  pairs?: Record<string, string>;
  table?: Record<string, string>;
}

export function StudentItem({
  item,
  submission,
  reactionPicker,
  saveDrawing,
  drawingOverride,
  liveDraw = false,
  drawStartActive,
}: {
  item: ItemRow;
  submission?: ItemSubmissionRow;
  reactionPicker?: import("react").ReactNode;
  saveDrawing?: (dataUrl: string | null) => Promise<void>;
  drawingOverride?: string | null;
  liveDraw?: boolean;
  drawStartActive?: boolean;
}) {
  const review = useContext(ReviewContext);
  const submittedAt = submission?.submitted_at;
  const [cleared, setCleared] = useState(false);
  // A new saved submission (student re-took) clears the local retry state.
  useEffect(() => setCleared(false), [submittedAt]);

  const initialScore = cleared ? undefined : submission ? submission.score : undefined;
  const savedAnswer = cleared ? undefined : (submission?.answer as unknown as SavedAnswer | undefined);
  const canRetry = !review && !item.retry_disabled && submission !== undefined && !cleared;
  const showExplanation =
    !cleared && Boolean(item.explanation) && submission?.score != null && submission.score < 100;
  // Remount the solve on retake / new submission so its internal state resets.
  const solveKey = `${submittedAt ?? "new"}-${cleared ? "retry" : "done"}`;

  function render() {
    switch (item.type) {
      case "INFO":
        return <InfoView doc={(item.content as unknown as InfoContent).doc} />;
      case "AUDIO":
        return <AudioPlayer src={(item.content as unknown as AudioContent).audioUrl} />;
      case "VIDEO":
        return <VideoEmbed url={(item.content as unknown as VideoContent).url} />;
      case "IMAGE": {
        const c = item.content as unknown as ImageContent;
        return <ImageAnnotate url={c.url} caption={c.caption} annotations={c.annotations} />;
      }
      case "CAROUSEL":
        return <Carousel images={(item.content as unknown as CarouselContent).images} />;
      case "LINK": {
        const c = item.content as unknown as LinkContent;
        return (
          <Button asChild variant="outline" size="sm">
            <a href={c.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {c.label || "Перейти по ссылке"}
            </a>
          </Button>
        );
      }
      case "QUIZ":
        return <QuizSolve itemId={item.id} content={item.content as unknown as QuizContent} initialScore={initialScore} initialAnswer={savedAnswer} />;
      case "GAPS": {
        const c = item.content as unknown as GapsContent;
        if (c.mode === "DRAG") return <GapsDragSolve itemId={item.id} content={c} initialScore={initialScore} initialAnswer={savedAnswer} />;
        return <GapsSolve itemId={item.id} content={c} initialScore={initialScore} initialAnswer={savedAnswer} />;
      }
      case "IMAGE_TASK":
        return <ImageTaskSolve itemId={item.id} content={item.content as unknown as ImageTaskContent} initialScore={initialScore} initialAnswer={savedAnswer} />;
      case "SENTENCE_TASK":
        return <SentenceSolve itemId={item.id} content={item.content as unknown as SentenceTaskContent} initialScore={initialScore} initialAnswer={savedAnswer} />;
      case "MATCH": {
        const c = item.content as unknown as MatchContent;
        const table = getMatchTable(c);
        return <MatchColumnsSolve itemId={item.id} content={c} columns={table.columns} rows={table.rows} initialScore={initialScore} initialAnswer={savedAnswer} />;
      }
      case "FREE": {
        const answer = (cleared ? {} : submission?.answer ?? {}) as { text?: string };
        return (
          <FreeSolve
            itemId={item.id}
            content={item.content as unknown as FreeContent}
            initialAnswer={answer.text ?? ""}
            initialScore={initialScore}
            editedAnswer={cleared ? null : submission?.edited_answer ?? null}
          />
        );
      }
      default:
        return <p className="text-sm text-muted-foreground">{NOT_YET_INTERACTIVE}</p>;
    }
  }

  return (
    <Card id={`item-${item.id}`} className="scroll-mt-20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b py-2">
        <CardTitle className="text-sm font-medium">
          {item.title ? <FormattedText text={item.title} /> : TYPE_LABELS[item.type]}
        </CardTitle>
        {reactionPicker ??
          (submission?.reaction ? (
            <span className="text-xl" title="Реакция преподавателя">{submission.reaction}</span>
          ) : null)}
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <DrawableBlock
          initial={drawingOverride !== undefined ? drawingOverride : item.drawing}
          onSave={saveDrawing}
          autoSave={liveDraw}
          startActive={drawStartActive}
        >
          <div key={solveKey} style={itemTextStyle(item.font_family, item.font_size)}>{render()}</div>
        </DrawableBlock>
        {showExplanation ? (
          <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <p><FormattedText text={item.explanation} /></p>
          </div>
        ) : null}
        {canRetry ? (
          <Button size="sm" variant="outline" onClick={() => setCleared(true)}>
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
