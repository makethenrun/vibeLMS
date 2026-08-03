"use client";

import { ExternalLink } from "lucide-react";

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
import { FreeSolve } from "./free-solve";
import { GapsSolve } from "./gaps-solve";
import { InfoView } from "./info-view";
import { QuizSolve } from "./quiz-solve";
import { GapsDragSolve } from "./solves/gaps-drag-solve";
import { ImageTaskSolve } from "./solves/image-task-solve";
import { MatchPairsSolve } from "./solves/match-pairs-solve";
import { SentenceSolve } from "./solves/sentence-solve";

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

export function StudentItem({ item, submission }: { item: ItemRow; submission?: ItemSubmissionRow }) {
  const initialScore = submission ? submission.score : undefined;

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
        return (
          <figure className="space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.url} alt={c.caption ?? ""} className="max-h-80 rounded-lg border object-contain" />
            {c.caption ? <figcaption className="text-sm text-muted-foreground">{c.caption}</figcaption> : null}
          </figure>
        );
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
        return <QuizSolve itemId={item.id} content={item.content as unknown as QuizContent} initialScore={initialScore} />;
      case "GAPS": {
        const c = item.content as unknown as GapsContent;
        if (c.mode === "DRAG") return <GapsDragSolve itemId={item.id} content={c} initialScore={initialScore} />;
        return <GapsSolve itemId={item.id} content={c} initialScore={initialScore} />;
      }
      case "IMAGE_TASK":
        return <ImageTaskSolve itemId={item.id} content={item.content as unknown as ImageTaskContent} initialScore={initialScore} />;
      case "SENTENCE_TASK":
        return <SentenceSolve itemId={item.id} content={item.content as unknown as SentenceTaskContent} initialScore={initialScore} />;
      case "MATCH": {
        const c = item.content as unknown as MatchContent;
        return <MatchPairsSolve itemId={item.id} content={c} pairs={c.pairs} initialScore={initialScore} />;
      }
      case "FREE": {
        const answer = (submission?.answer ?? {}) as { text?: string };
        return (
          <FreeSolve
            itemId={item.id}
            content={item.content as unknown as FreeContent}
            initialAnswer={answer.text ?? ""}
            initialScore={initialScore}
          />
        );
      }
      default:
        return <p className="text-sm text-muted-foreground">{NOT_YET_INTERACTIVE}</p>;
    }
  }

  return (
    <Card id={`item-${item.id}`} className="scroll-mt-20">
      <CardHeader className="border-b py-2">
        <CardTitle className="text-sm font-medium">
          {item.title || TYPE_LABELS[item.type]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{render()}</CardContent>
    </Card>
  );
}
