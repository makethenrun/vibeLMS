"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CarouselImage {
  url: string;
  caption: string | null;
}

export function Carousel({ images }: { images: CarouselImage[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет изображений.</p>;
  }
  const current = images[Math.min(index, images.length - 1)];

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption ?? "Изображение"} className="mx-auto aspect-square w-full max-w-[200px] rounded-2xl object-cover" />
        {images.length > 1 ? (
          <>
            <Button
              type="button" size="icon" variant="secondary"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Назад"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button" size="icon" variant="secondary"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Вперёд"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
      {current.caption ? <p className="text-center text-sm text-muted-foreground">{current.caption}</p> : null}
      {images.length > 1 ? (
        <p className="text-center text-xs text-muted-foreground">{Math.min(index, images.length - 1) + 1} / {images.length}</p>
      ) : null}
    </div>
  );
}
